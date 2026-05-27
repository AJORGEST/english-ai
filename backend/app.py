import os
import sqlite3
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env se existir
load_dotenv()

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
# Habilita CORS para permitir comunicação do React frontend
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", os.environ.get("FRONTEND_URL", "*")])

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

# Placeholder padrão do arquivo .env.example — considerado como não configurado
PLACEHOLDER_KEY = "SUA_CHAVE_API_AQUI"

def get_api_key():
    """Lê a chave do ambiente. Retorna None se não configurada ou for placeholder."""
    # Recarrega o .env em cada chamada para capturar edições sem reiniciar
    load_dotenv(override=True)
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key or key == PLACEHOLDER_KEY:
        return None
    return key

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa as tabelas do banco de dados se não existirem."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT NOT NULL, -- 'student' ou 'teacher'
                text TEXT NOT NULL,
                is_correct INTEGER,   -- 1 se correto, 0 se incorreto, NULL para o professor
                corrections TEXT,     -- JSON array de correções (se houver)
                explanation TEXT,     -- Explicação gramatical em português (se houver)
                extra_data TEXT,      -- JSON com campos extras (corrected_text, pronunciation, suggested_replies)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Adiciona coluna extra_data se não existir (migração)
        try:
            conn.execute("ALTER TABLE messages ADD COLUMN extra_data TEXT")
        except:
            pass
        conn.commit()

# Inicializa o banco de dados
init_db()

@app.route("/chat", methods=["POST"])
def chat():
    # Verifica se a chave foi configurada e não é o placeholder padrão
    api_key = get_api_key()
    if not api_key:
        return jsonify({
            "error": "Configuração Pendente",
            "reply": "Olá! Você precisa configurar sua chave da API do Gemini no arquivo backend/.env. Acesse aistudio.google.com para gerar uma chave gratuita!"
        }), 400

    data = request.json
    if not data or "message" not in data:
        return jsonify({"error": "Mensagem inválida"}), 400

    student_message = data["message"].strip()
    if not student_message:
        return jsonify({"error": "Mensagem vazia"}), 400

    topic = data.get("topic", "free")
    topic_map = {
        "free": "",
        "travel": "O tema da conversa é VIAGEM (aeroportos, hotéis, destinos, transporte, turismo).",
        "work": "O tema da conversa é TRABALHO (escritório, reuniões, carreira, entrevistas, profissões).",
        "education": "O tema da conversa é EDUCAÇÃO (escola, universidade, estudos, matérias, professores).",
        "health": "O tema da conversa é SAÚDE (médico, hospital, sintomas, exercícios, bem-estar).",
        "sports": "O tema da conversa é ESPORTES (futebol, basquete, corrida, competições, times).",
        "technology": "O tema da conversa é INFORMÁTICA/TECNOLOGIA (computadores, programação, internet, apps, gadgets).",
        "leisure": "O tema da conversa é LAZER (hobbies, parques, jogos, fins de semana, diversão).",
        "objects": "O tema da conversa é OBJETOS DO DIA A DIA (móveis, utensílios, ferramentas, roupas, acessórios).",
        "animals": "O tema da conversa é ANIMAIS (pets, animais selvagens, fazenda, natureza).",
        "food": "O tema da conversa é COMIDA (restaurantes, receitas, ingredientes, culinária, bebidas).",
        "family": "O tema da conversa é FAMÍLIA (pais, irmãos, relacionamentos, casa, rotina familiar).",
        "shopping": "O tema da conversa é COMPRAS (lojas, preços, roupas, supermercado, online shopping).",
        "movies": "O tema da conversa é FILMES E SÉRIES (cinema, atores, gêneros, streaming, episódios).",
        "music": "O tema da conversa é MÚSICA (bandas, cantores, instrumentos, shows, gêneros musicais).",
    }
    topic_instruction = topic_map.get(topic, "")

    try:
        # Recupera as últimas 10 mensagens do banco para dar contexto ao Gemini
        # Isso permite uma conversa contínua e contextualizada
        context = ""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT sender, text FROM messages 
                ORDER BY id DESC LIMIT 10
            """)
            rows = cursor.fetchall()
            # Inverte para ficar em ordem cronológica
            for row in reversed(rows):
                sender_name = "Aluno" if row["sender"] == "student" else "Professor"
                context += f"{sender_name}: {row['text']}\n"

        # Configura o prompt com instruções estritas para o Gemini retornar JSON
        prompt = f"""
Você é um professor de inglês amigável, acolhedor e altamente qualificado. 
Sua tarefa é analisar a frase enviada pelo aluno, corrigindo quaisquer erros gramaticais, ortográficos ou de escolha de palavras, e responder de forma a manter a conversa fluindo.
{topic_instruction}
IMPORTANTE: Ignore o histórico anterior se ele não for sobre o tema atual. Foque EXCLUSIVAMENTE no tema escolhido. Suas perguntas, respostas e sugestões do quiz devem ser 100% sobre o tema.

Histórico recente da conversa:
{context}

Frase atual do aluno:
"{student_message}"

Instruções importantes:
1. Responda ESTRITAMENTE em formato JSON com as chaves indicadas abaixo. Não inclua blocos de markdown adicionais como ```json ... ``` ou outros textos antes ou depois. Retorne APENAS o JSON puro.
2. Campos que o JSON deve conter:
   - "original_text": A frase original enviada pelo aluno.
   - "is_correct": true se a frase estiver 100% correta gramaticalmente e soar natural. Caso tenha erros ou pareça muito artificial, defina como false.
   - "corrected_text": A frase corrigida completa, como deveria ser escrita corretamente. Se já estiver correta, repita a frase original.
   - "pronunciation": A pronúncia da frase corrigida em notação IPA (International Phonetic Alphabet). Ex: "/aɪ wɒnt tuː lɜːrn ˈɪŋɡlɪʃ/"
   - "corrections": Uma lista (array de strings) contendo os termos incorretos e suas devidas correções (ex: ["I has -> I have", "car blue -> blue car"]). Se estiver 100% correta, retorne uma lista vazia [].
   - "explanation": Explicação curta e didática do erro em PORTUGUÊS. Se a frase estiver totalmente correta, aproveite para elogiar a estrutura usada e, se aplicável, sugerir uma alternativa ainda mais informal ou avançada para expandir o vocabulário do aluno.
   - "teacher_reply": A resposta do professor em INGLÊS, dando continuidade à conversa. Seja simpático, faça perguntas para incentivar o aluno a responder de volta e limite a resposta a 1 ou 2 frases curtas.
   - "suggested_replies": Uma lista (array de objetos) contendo EXATAMENTE 3 opções de resposta para um quiz. Cada objeto deve ter: "text" (a frase em inglês) e "is_correct" (boolean). APENAS UMA opção deve ter is_correct=true (a frase gramaticalmente correta e natural). As outras 2 devem ter is_correct=false (frases com erros gramaticais sutis mas plausíveis). Embaralhe a ordem para que a correta não fique sempre na mesma posição.

Exemplo de formato de retorno esperado:
{{
  "original_text": "I wants learn english.",
  "is_correct": false,
  "corrected_text": "I want to learn English.",
  "pronunciation": "/aɪ wɒnt tuː lɜːrn ˈɪŋɡlɪʃ/",
  "corrections": ["I wants -> I want", "learn english -> to learn English"],
  "explanation": "Com o pronome 'I', o verbo não ganha 's' (que é exclusivo de he/she/it). Além disso, usamos a preposição 'to' para conectar o verbo 'want' ao infinitivo 'learn', e 'English' deve sempre começar com letra maiúscula.",
  "teacher_reply": "That's awesome! Why do you want to learn English?",
  "suggested_replies": [
    {{"text": "I want to learn English for my career.", "is_correct": true}},
    {{"text": "I wants learn English for my career.", "is_correct": false}},
    {{"text": "I want learn English to my career.", "is_correct": false}}
  ]
}}
"""

        # Configura a API com a chave atual (aceita edições no .env sem restart)
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Chamada com o prompt
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse do JSON retornado pelo Gemini
        result = json.loads(response.text.strip())
        
        # Salva a mensagem do aluno no banco de dados SQLite
        with get_db() as conn:
            cursor = conn.cursor()
            extra = json.dumps({
                "corrected_text": result.get("corrected_text", ""),
                "pronunciation": result.get("pronunciation", ""),
            })
            cursor.execute("""
                INSERT INTO messages (sender, text, is_correct, corrections, explanation, extra_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "student",
                student_message,
                1 if result.get("is_correct") else 0,
                json.dumps(result.get("corrections", [])),
                result.get("explanation", ""),
                extra
            ))
            
            # Salva a resposta do professor no banco de dados
            teacher_extra = json.dumps({
                "suggested_replies": result.get("suggested_replies", []),
            })
            cursor.execute("""
                INSERT INTO messages (sender, text, is_correct, corrections, explanation, extra_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "teacher",
                result.get("teacher_reply", ""),
                None,
                None,
                None,
                teacher_extra
            ))
            conn.commit()

        # Retorna o resultado para o frontend
        return jsonify(result)

    except json.JSONDecodeError:
        logging.exception("Failed to decode Gemini JSON response")
        return jsonify({
            "error": "Erro no processamento da resposta da IA",
            "reply": "Sorry, I had trouble organizing my thoughts. Could you repeat that?"
        }), 500
    except Exception as e:
        logging.exception("Chat error")
        return jsonify({
            "error": "Erro interno",
            "reply": "Sorry, I am facing some connection issues. Let's try again in a moment."
        }), 500

@app.route("/history", methods=["GET"])
def history():
    """Retorna o histórico completo do chat salvo no SQLite."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM messages ORDER BY id ASC")
            rows = cursor.fetchall()
            
            history_list = []
            for row in rows:
                corrections_json = []
                if row["corrections"]:
                    try:
                        corrections_json = json.loads(row["corrections"])
                    except:
                        pass
                
                extra = {}
                if row["extra_data"]:
                    try:
                        extra = json.loads(row["extra_data"])
                    except:
                        pass
                        
                entry = {
                    "id": row["id"],
                    "sender": row["sender"],
                    "text": row["text"],
                    "is_correct": True if row["is_correct"] == 1 else (False if row["is_correct"] == 0 else None),
                    "corrections": corrections_json,
                    "explanation": row["explanation"],
                    "created_at": row["created_at"]
                }
                entry.update(extra)
                history_list.append(entry)
            return jsonify(history_list)
    except Exception as e:
        logging.exception("Error fetching history")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/clear", methods=["POST"])
def clear():
    """Limpa todo o histórico de conversas do banco."""
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM messages")
            conn.commit()
        return jsonify({"status": "success", "message": "Histórico limpo com sucesso!"})
    except Exception as e:
        logging.exception("Error clearing history")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/stats", methods=["GET"])
def stats():
    """Retorna estatísticas de aprendizado com base nas mensagens salvas."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Total de frases do aluno
            cursor.execute("SELECT COUNT(*) as total FROM messages WHERE sender = 'student'")
            total_sentences = cursor.fetchone()["total"]
            
            # Frases corretas
            cursor.execute("SELECT COUNT(*) as correct FROM messages WHERE sender = 'student' AND is_correct = 1")
            correct_sentences = cursor.fetchone()["correct"]
            
            # Frases incorretas (erros)
            cursor.execute("SELECT COUNT(*) as incorrect FROM messages WHERE sender = 'student' AND is_correct = 0")
            incorrect_sentences = cursor.fetchone()["incorrect"]
            
            accuracy_rate = 100.0
            if total_sentences > 0:
                accuracy_rate = round((correct_sentences / total_sentences) * 100, 1)
                
            # Lista de erros recentes para revisão
            cursor.execute("""
                SELECT text, corrections, explanation, created_at 
                FROM messages 
                WHERE sender = 'student' AND is_correct = 0 
                ORDER BY id DESC LIMIT 20
            """)
            error_rows = cursor.fetchall()
            
            revision_list = []
            for row in error_rows:
                corrections_json = []
                if row["corrections"]:
                    try:
                        corrections_json = json.loads(row["corrections"])
                    except:
                        pass
                revision_list.append({
                    "text": row["text"],
                    "corrections": corrections_json,
                    "explanation": row["explanation"],
                    "created_at": row["created_at"]
                })
                
            return jsonify({
                "total_sentences": total_sentences,
                "correct_sentences": correct_sentences,
                "incorrect_sentences": incorrect_sentences,
                "accuracy_rate": accuracy_rate,
                "revision_list": revision_list
            })
    except Exception as e:
        logging.exception("Error fetching stats")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "English AI Backend running"})

@app.route("/translate", methods=["POST"])
def translate():
    """Traduz texto entre PT↔EN usando Gemini."""
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "API key não configurada"}), 400

    data = request.json
    text = (data or {}).get("text", "").strip()
    direction = (data or {}).get("direction", "pt-en")  # "pt-en" ou "en-pt"

    if not text:
        return jsonify({"error": "Texto vazio"}), 400

    try:
        if direction == "pt-en":
            prompt = f'Traduza o seguinte texto do português para o inglês. Retorne APENAS o JSON puro: {{"translation": "...", "pronunciation": "...pronúncia IPA da tradução..."}}.\n\nTexto: "{text}"'
        else:
            prompt = f'Traduza o seguinte texto do inglês para o português. Retorne APENAS o JSON puro: {{"translation": "...", "pronunciation": "...pronúncia IPA do texto original em inglês..."}}.\n\nTexto: "{text}"'

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        result = json.loads(response.text.strip())
        return jsonify(result)
    except Exception as e:
        logging.exception("Translation error")
        return jsonify({"error": "Erro ao traduzir"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False") == "True"
    app.run(host="0.0.0.0", port=port, debug=debug)
