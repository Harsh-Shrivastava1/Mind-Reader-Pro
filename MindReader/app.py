import os
import random
import time
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
# Secure key for session management
app.secret_key = os.urandom(24)

# ==========================================
# LOGIC FUNCTIONS
# ==========================================

def generate_spatial_variable(mode):
    """
    Generate the N variable based on the system mode.
    Basic mode uses simpler numbers. Advanced/Debug use wider ranges.
    Always returns an even number to keep baseline math clean.
    """
    if mode == "basic":
        return random.choice([10, 20, 50, 100])
    return random.randrange(2, 200, 2)

def calculate_confidence_score(received_y, calculated_x):
    """
    Determines system confidence in the reconstruction.
    - Integers: 95% - 99.9%
    - Decimals: 85% - 94.9%
    - Very large numbers (>100,000): -2% penalty
    """
    is_decimal = False
    
    # Check if inputs or outputs contain floating precision
    if (isinstance(received_y, float) and not received_y.is_integer()) or \
       (isinstance(calculated_x, float) and not calculated_x.is_integer()):
        is_decimal = True
        
    if is_decimal:
        base_confidence = random.uniform(85.0, 94.9)
    else:
        base_confidence = random.uniform(95.0, 99.9)
        
    # Penalty for extreme numbers
    if abs(received_y) > 100000 or abs(calculated_x) > 100000:
        base_confidence -= random.uniform(1.0, 3.0)
        
    return min(99.99, max(0.01, round(base_confidence, 2)))

def generate_explanation(N_used, y_val, x_val, mode):
    """
    Generates the explanation panel text. Switches format if Debug Mode is active.
    """
    if mode == "debug":
        return (
            "[TRANSPARENCY LOGS]\n"
            f"> Retrieved N (spatial constant): {N_used}\n"
            f"> System received final output (y): {y_val}\n"
            f"> Target Reverse Equation: x = y - (N / 2)\n"
            f"> Execution: x = {y_val} - ({N_used} / 2)\n"
            f"> Calculated original seed (x): {x_val}"
        )
    return "We reversed your transformation by subtracting half of the added constant from your parsed outcome."

# ==========================================
# ROUTES
# ==========================================

@app.route("/")
def index():
    """Renders the main dashboard UI."""
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def initialize_sequence():
    """
    Initializes a new cognitive sequence, generating the required mathematical constants.
    """
    data = request.json or {}
    mode = data.get("mode", "advanced")
    
    # Generate and store N in secure session
    N = generate_spatial_variable(mode)
    session['current_N'] = N
    session['current_mode'] = mode
    
    return jsonify({
        "N": N,
        "mode": mode,
        "status": "success",
        "message": "System spatial parameters generated."
    })

@app.route("/guess", methods=["POST"])
def reconstruct_thought():
    """
    Endpoint that accepts the user calculated result (y) and reconstructs the original seed (x).
    """
    data = request.json
    
    # Basic Input Validation
    if not data or "final_result" not in data:
        return jsonify({"error": "Missing payload: final_result is required."}), 400
        
    try:
        y = float(data["final_result"])
    except ValueError:
        return jsonify({"error": "Data formatting error: Input must be a valid number (decimals/negatives allowed)."}), 400
        
    mode = data.get("mode", session.get("current_mode", "advanced"))
    N = session.get('current_N')
    
    if N is None:
        return jsonify({"error": "Session expired or invalid. Please re-initialize the sequence."}), 400
        
    # Core Reconstruction Math
    # Formula: x = y - (N / 2)
    original_number = y - (N / 2.0)
    
    # Clean integer casting if the result naturally resolves to a whole number
    if original_number.is_integer():
        original_number = int(original_number)
    else:
        original_number = round(original_number, 4) # Allow precision
        
    confidence = calculate_confidence_score(y, original_number)
    explanation = generate_explanation(N, y, original_number, mode)
    
    # Clear session to ensure a clean slate next round
    session.pop('current_N', None)
    
    return jsonify({
        "original_number": original_number,
        "confidence": confidence,
        "explanation": explanation,
        "N_used": N
    })

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)