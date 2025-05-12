import os
import json
import base64
import time
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import speech_recognition as sr
import anthropic
from dotenv import load_dotenv
import eventlet

# Load environment variables
load_dotenv()

# Patch eventlet
eventlet.monkey_patch()

app = Flask(__name__)
CORS(app)  # Enable CORS for React
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize Anthropic client
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

# Initialize speech recognizer
recognizer = sr.Recognizer()

# Scenario prompts
SCENARIOS = {
    "software_engineer": {
        "system_prompt": "You are a technical team lead in a software development team. You will role-play a sprint status meeting where the user is a software engineer giving their status update. Listen to their update, ask relevant follow-up questions, and provide realistic responses as if you were in the meeting. After the conversation ends, provide constructive feedback on their communication clarity, technical detail level, problem-solving approach, and overall effectiveness. Be supportive but honest.",
        "initial_prompt": "Hi there, it's time for our team status update. Can you tell me what you've been working on this sprint, any challenges you're facing, and your plan for the upcoming week?"
    },
    "insurance_agent": {
        "system_prompt": "You are a potential customer interested in insurance products. You will role-play a sales conversation where the user is an insurance agent trying to sell you a policy. Respond naturally to their sales pitch, ask questions a typical customer would ask, and show varying levels of interest based on the quality of their pitch. After the conversation ends, provide constructive feedback on their sales approach, communication style, how well they addressed concerns, product knowledge, and closing technique. Be supportive but honest.",
        "initial_prompt": "Hello, I received your call about insurance options. I'm not currently in the market, but I'm willing to hear what you have to offer. What kind of policies do you provide?"
    }
}

@app.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    """Return available role-play scenarios"""
    return jsonify({
        "scenarios": [
            {
                "id": "software_engineer",
                "title": "Software Engineer Status Update",
                "description": "Practice giving a status update in a sprint meeting"
            },
            {
                "id": "insurance_agent",
                "title": "Insurance Sales Pitch",
                "description": "Practice selling insurance to a potential client"
            }
        ]
    })

@app.route('/api/start_session', methods=['POST'])
def start_session():
    """Initialize a new role-play session"""
    data = request.json
    scenario = data.get('scenario', 'software_engineer')
    
    if scenario not in SCENARIOS:
        return jsonify({"error": "Invalid scenario"}), 400
    
    # Return the initial prompt for the selected scenario
    return jsonify({
        "initial_prompt": SCENARIOS[scenario]["initial_prompt"]
    })

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print('Client disconnected')

@socketio.on('audio_data')
def handle_audio_data(audio_data):
    """Process audio data from the client"""
    try:
        # Decode base64 audio data
        audio_bytes = base64.b64decode(audio_data['audio'])
        scenario = audio_data.get('scenario', 'software_engineer')
        conversation_history = audio_data.get('conversation_history', [])
        is_final = audio_data.get('is_final', False)  # Flag to indicate if this is the final chunk
        
        # Process audio to text
        text = process_audio_to_text(audio_bytes)
        
        if text:
            # Send the transcribed text back to the client
            emit('transcription', {
                'text': text,
                'is_final': is_final
            })
            
            # Only process with Claude API if this is the final chunk
            if is_final:
                # Process with Claude API
                ai_response = get_claude_response(text, scenario, conversation_history)
                
                # Update conversation history
                conversation_history.append({"role": "user", "content": text})
                conversation_history.append({"role": "assistant", "content": ai_response})
                
                # Send the AI response back to the client
                emit('ai_response', {
                    'text': ai_response,
                    'conversation_history': conversation_history
                })
        else:
            emit('error', {'message': 'Failed to transcribe audio'})
    
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        emit('error', {'message': str(e)})

@socketio.on('end_session')
def handle_end_session(data):
    """Generate feedback at the end of the session"""
    try:
        scenario = data.get('scenario', 'software_engineer')
        conversation_history = data.get('conversation_history', [])
        
        # Generate feedback with Claude
        feedback = generate_feedback(scenario, conversation_history)
        
        # Send feedback to the client
        emit('session_feedback', {'feedback': feedback})
        
    except Exception as e:
        print(f"Error generating feedback: {str(e)}")
        emit('error', {'message': str(e)})

def process_audio_to_text(audio_bytes):
    """Convert audio data to text using speech recognition"""
    try:
        # For MVP: Use a placeholder implementation
        # In production: Implement actual speech recognition
        
        # Convert bytes to audio source for speech recognition
        # For MVP, we'll return a placeholder string
        # In real implementation:
        # audio_data = sr.AudioData(audio_bytes, sample_rate=16000, sample_width=2)
        # text = recognizer.recognize_google(audio_data)
        # return text
        
        # Simulate real-time transcription with a delay
        time.sleep(0.1)  # Simulate processing time
        return "This is a placeholder for the transcribed text. In the actual implementation, this would be the result of processing the audio data through speech recognition."
    except Exception as e:
        print(f"Speech recognition error: {str(e)}")
        return None

def get_claude_response(user_text, scenario, conversation_history):
    """Get a response from Claude based on the user's input"""
    try:
        # Prepare the messages for Claude
        messages = [
            {"role": "system", "content": SCENARIOS[scenario]["system_prompt"]}
        ]
        
        # Add conversation history
        for message in conversation_history:
            messages.append(message)
            
        # Add the current user message
        messages.append({"role": "user", "content": user_text})
        
        # Call the Claude API
        response = client.messages.create(
            model="claude-3-sonnet-20240229",  # TODO: Update to latest model when available
            max_tokens=1000,
            temperature=0.7,
            messages=messages
        )
        
        # Extract and return the response text
        return response.content[0].text
        
    except Exception as e:
        print(f"Claude API error: {str(e)}")
        return "I'm sorry, I couldn't process your response. Please check your internet connection and try again."

def generate_feedback(scenario, conversation_history):
    """Generate feedback on the role-play session"""
    try:
        # Prepare the feedback prompt for Claude
        feedback_prompt = f"Based on the conversation, provide detailed feedback on the user's performance in this {scenario} role-play scenario. Focus on strengths, areas for improvement, and specific actionable suggestions."
        
        messages = [
            {"role": "system", "content": SCENARIOS[scenario]["system_prompt"]}
        ]
        
        # Add conversation history
        for message in conversation_history:
            messages.append(message)
            
        # Add the feedback request
        messages.append({"role": "user", "content": feedback_prompt})
        
        # Call the Claude API
        response = client.messages.create(
            model="claude-3-sonnet-20240229",  # TODO: Update to latest model when available
            max_tokens=1500,
            temperature=0.2,  # Lower temperature for more consistent feedback
            messages=messages
        )
        
        # Extract and return the feedback text
        return response.content[0].text
        
    except Exception as e:
        print(f"Feedback generation error: {str(e)}")
        return "I'm sorry, I couldn't generate feedback. Please check your internet connection and try again."

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)