import os

from flask import (
    Flask,
    render_template,
    request,
    jsonify
)

from dotenv import load_dotenv

from config import (
    DATABASE_NAME,
    UPLOAD_FOLDER,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
    MAX_MESSAGE_LENGTH,
    SECRET_KEY
)

from utils import (
    generate_title,
    extract_text_from_file,
    get_safe_filename,
    get_unique_filename,
    allowed_file,
    truncate_text,
    ensure_directory
)

from ai import generate_response

from database import (
    initialize_database,
    create_conversation,
    get_conversations,
    search_conversations,
    get_conversation,
    get_messages,
    save_message,
    rename_conversation,
    delete_conversation
)


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# CREATE APPLICATION
# ============================================================

app = Flask(__name__)

app.secret_key = SECRET_KEY

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


# ============================================================
# PREPARE DIRECTORIES AND DATABASE
# ============================================================

ensure_directory(UPLOAD_FOLDER)

initialize_database()


# ============================================================
# HOME
# ============================================================

@app.route("/")
def index():

    return render_template("index.html")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "status": "ok",
        "message": "Felix AI is running"
    })


# ============================================================
# GET CONVERSATIONS
# ============================================================

@app.route(
    "/api/conversations",
    methods=["GET"]
)
def conversations():

    search_term = request.args.get(
        "search",
        ""
    ).strip()

    try:

        if search_term:

            conversations = search_conversations(
                search_term
            )

        else:

            conversations = get_conversations()

        return jsonify({
            "success": True,
            "conversations": conversations
        })

    except Exception as error:

        app.logger.exception(
            "Unable to load conversations"
        )

        return jsonify({
            "success": False,
            "error": str(error),
            "conversations": []
        }), 500


# ============================================================
# CREATE EMPTY CONVERSATION
# ============================================================

@app.route(
    "/api/conversations",
    methods=["POST"]
)
def create_new_conversation():

    data = request.get_json(
        silent=True
    ) or {}

    title = str(
        data.get(
            "title",
            "New Chat"
        )
    ).strip()

    if not title:

        title = "New Chat"

    try:

        conversation_id = create_conversation(
            title
        )

        return jsonify({
            "success": True,
            "conversation_id": conversation_id,
            "title": title
        })

    except Exception as error:

        app.logger.exception(
            "Unable to create conversation"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ============================================================
# GET ONE CONVERSATION
# ============================================================

@app.route(
    "/api/conversations/<int:conversation_id>",
    methods=["GET"]
)
def conversation_details(
    conversation_id
):

    try:

        conversation = get_conversation(
            conversation_id
        )

        if conversation is None:

            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

        messages = get_messages(
            conversation_id
        )

        return jsonify({
            "success": True,
            "conversation": conversation,
            "messages": messages
        })

    except Exception as error:

        app.logger.exception(
            "Unable to load conversation"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ============================================================
# RENAME CONVERSATION
# ============================================================

@app.route(
    "/api/conversations/<int:conversation_id>",
    methods=["PATCH"]
)
def update_conversation(
    conversation_id
):

    data = request.get_json(
        silent=True
    ) or {}

    title = str(
        data.get(
            "title",
            ""
        )
    ).strip()

    if not title:

        return jsonify({
            "success": False,
            "error": "A conversation title is required."
        }), 400

    try:

        conversation = get_conversation(
            conversation_id
        )

        if conversation is None:

            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

        rename_conversation(
            conversation_id,
            title[:100]
        )

        return jsonify({
            "success": True,
            "title": title[:100]
        })

    except Exception as error:

        app.logger.exception(
            "Unable to rename conversation"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ============================================================
# DELETE CONVERSATION
# ============================================================

@app.route(
    "/api/conversations/<int:conversation_id>",
    methods=["DELETE"]
)
def remove_conversation(
    conversation_id
):

    try:

        conversation = get_conversation(
            conversation_id
        )

        if conversation is None:

            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

        delete_conversation(
            conversation_id
        )

        return jsonify({
            "success": True
        })

    except Exception as error:

        app.logger.exception(
            "Unable to delete conversation"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ============================================================
# FILE UPLOAD
# ============================================================

@app.route(
    "/api/upload",
    methods=["POST"]
)
def upload_file():

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "error": "No file was uploaded."
        }), 400

    file = request.files["file"]

    if not file.filename:

        return jsonify({
            "success": False,
            "error": "No filename was provided."
        }), 400

    safe_filename = get_safe_filename(
        file.filename
    )

    if not allowed_file(
        safe_filename,
        {
            ".txt",
            ".md",
            ".csv",
            ".json",
            ".pdf",
            ".docx"
        }
    ):

        return jsonify({
            "success": False,
            "error": "File type is not supported."
        }), 400

    # ---------------------------------------------------------
    # CHECK FILE SIZE
    # ---------------------------------------------------------

    file.seek(0, 2)

    file_size = file.tell()

    file.seek(0)

    if file_size > MAX_FILE_SIZE:

        return jsonify({
            "success": False,
            "error": "The file is larger than 10 MB."
        }), 413

    unique_filename = get_unique_filename(
        safe_filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    try:

        file.save(
            file_path
        )

        extracted_text = extract_text_from_file(
            file_path
        )

        extracted_text = truncate_text(
            extracted_text,
            max_length=12000
        )

        return jsonify({
            "success": True,
            "filename": safe_filename,
            "stored_filename": unique_filename,
            "text": extracted_text
        })

    except Exception as error:

        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            pass

        app.logger.exception(
            "File processing failed"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400


# ============================================================
# CHAT
# ============================================================

@app.route(
    "/api/chat",
    methods=["POST"]
)
def chat():

    data = request.get_json(
        silent=True
    ) or {}

    message = str(
        data.get(
            "message",
            ""
        )
    ).strip()

    conversation_id = data.get(
        "conversation_id"
    )

    file_text = str(
        data.get(
            "file_text",
            ""
        )
    ).strip()

    # ---------------------------------------------------------
    # VALIDATE MESSAGE
    # ---------------------------------------------------------

    if not message and not file_text:

        return jsonify({
            "success": False,
            "error": "Please enter a message."
        }), 400

    if len(message) > MAX_MESSAGE_LENGTH:

        return jsonify({
            "success": False,
            "error": "Your message is too long."
        }), 400

    # ---------------------------------------------------------
    # VALIDATE / CREATE CONVERSATION
    # ---------------------------------------------------------

    if conversation_id:

        try:
            conversation_id = int(
                conversation_id
            )
        except (TypeError, ValueError):

            conversation_id = None

    if conversation_id:

        conversation = get_conversation(
            conversation_id
        )

        if conversation is None:

            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

    else:

        title_source = (
            message
            or "Uploaded document"
        )

        title = generate_title(
            title_source
        )

        conversation_id = create_conversation(
            title
        )

    # ---------------------------------------------------------
    # BUILD USER MESSAGE
    # ---------------------------------------------------------

    user_message = message

    if file_text:

        file_text = truncate_text(
            file_text,
            max_length=12000
        )

        if user_message:

            user_message = (
                f"{user_message}\n\n"
                f"Document content:\n"
                f"{file_text}"
            )

        else:

            user_message = (
                f"Please analyze the following "
                f"document:\n\n{file_text}"
            )

    # ---------------------------------------------------------
    # GET EXISTING CHAT HISTORY
    # ---------------------------------------------------------

    previous_messages = get_messages(
        conversation_id
    )

    ai_messages = []

    for item in previous_messages:

        role = item.get("role")

        content = item.get("content")

        if role in (
            "user",
            "assistant",
            "system"
        ) and content:

            ai_messages.append({
                "role": role,
                "content": content
            })

    # ---------------------------------------------------------
    # ADD CURRENT USER MESSAGE
    # ---------------------------------------------------------

    ai_messages.append({
        "role": "user",
        "content": user_message
    })

    # ---------------------------------------------------------
    # ASK AI
    # ---------------------------------------------------------

    try:

        ai_result = generate_response(
            ai_messages
        )

    except Exception as error:

        app.logger.exception(
            "AI request failed"
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500

    if not ai_result:

        return jsonify({
            "success": False,
            "error": "The AI returned an empty response."
        }), 500

    # ---------------------------------------------------------
    # SAVE USER MESSAGE
    # ---------------------------------------------------------

    save_message(
        conversation_id,
        "user",
        user_message
    )

    # ---------------------------------------------------------
    # SAVE ASSISTANT MESSAGE
    # ---------------------------------------------------------

    save_message(
        conversation_id,
        "assistant",
        ai_result
    )

    # ---------------------------------------------------------
    # GET UPDATED CONVERSATION
    # ---------------------------------------------------------

    conversation = get_conversation(
        conversation_id
    )

    return jsonify({
        "success": True,
        "response": ai_result,
        "conversation_id": conversation_id,
        "conversation": conversation
    })


# ============================================================
# FILE SIZE ERROR
# ============================================================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "The uploaded file is too large. Maximum size is 10 MB."
    }), 413


# ============================================================
# GENERAL ERROR
# ============================================================

@app.errorhandler(Exception)
def handle_error(error):

    app.logger.exception(
        "Unexpected application error"
    )

    return jsonify({
        "success": False,
        "error": str(error)
    }), 500


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )