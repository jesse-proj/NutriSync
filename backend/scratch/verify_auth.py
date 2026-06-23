import time
import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING AUTHENTICATION VERIFICATION TESTS ===")
    
    # 1. Health check
    try:
        r = httpx.get(f"{BASE_URL}/")
        print(f"Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Could not connect to server at {BASE_URL}. Ensure it is running! Error: {e}")
        return

    # Generate unique emails to avoid conflicts on repeated runs
    timestamp = int(time.time())
    patient_email = f"patient_{timestamp}@example.com"
    clinician_email = f"clinician_{timestamp}@example.com"
    password = "SuperSecurePassword123!"

    print("\n--- Test 1: Patient registration WITHOUT consent (DPA 2012 check) ---")
    payload = {
        "email": patient_email,
        "full_name": "Juan dela Cruz",
        "role": "patient",
        "consent_given": False,
        "password": password
    }
    r = httpx.post(f"{BASE_URL}/api/auth/register", json=payload)
    print(f"Status Code (Expected: 400): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 400, "Patient registration without consent should fail!"

    print("\n--- Test 2: Patient registration WITH consent (Success path) ---")
    payload["consent_given"] = True
    r = httpx.post(f"{BASE_URL}/api/auth/register", json=payload)
    print(f"Status Code (Expected: 201): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 201, "Patient registration with consent should succeed!"
    patient_data = r.json()
    assert patient_data["email"] == patient_email
    assert "hashed_password" not in patient_data, "Hashed password should not be in the response!"

    print("\n--- Test 3: Duplicate registration check ---")
    r = httpx.post(f"{BASE_URL}/api/auth/register", json=payload)
    print(f"Status Code (Expected: 400): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 400, "Duplicate registration should fail!"

    print("\n--- Test 4: Clinician registration ---")
    clinician_payload = {
        "email": clinician_email,
        "full_name": "Dr. Maria Santos",
        "role": "clinician",
        "consent_given": False,  # Clinicians don't need clinical patient consent
        "password": password
    }
    r = httpx.post(f"{BASE_URL}/api/auth/register", json=clinician_payload)
    print(f"Status Code (Expected: 201): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 201, "Clinician registration should succeed!"

    print("\n--- Test 5: Login via JSON (Client app flow) ---")
    login_payload = {
        "email": patient_email,
        "password": password
    }
    r = httpx.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print(f"Status Code (Expected: 200): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 200, "Login should succeed!"
    token_resp = r.json()
    assert "access_token" in token_resp
    assert token_resp["role"] == "patient"
    assert token_resp["full_name"] == "Juan dela Cruz"
    token = token_resp["access_token"]

    print("\n--- Test 6: Access protected endpoint /me WITHOUT token ---")
    r = httpx.get(f"{BASE_URL}/api/auth/me")
    print(f"Status Code (Expected: 401): {r.status_code}")
    assert r.status_code == 401

    print("\n--- Test 7: Access protected endpoint /me WITH invalid token ---")
    r = httpx.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"})
    print(f"Status Code (Expected: 401): {r.status_code}")
    assert r.status_code == 401

    print("\n--- Test 8: Access protected endpoint /me WITH valid token ---")
    r = httpx.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"Status Code (Expected: 200): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 200
    user_data = r.json()
    assert user_data["email"] == patient_email
    assert user_data["role"] == "patient"

    print("\n--- Test 9: Login via Form URL-encoded (Swagger flow) ---")
    form_data = {
        "username": clinician_email,  # OAuth2 password flow uses 'username'
        "password": password
    }
    r = httpx.post(f"{BASE_URL}/api/auth/token", data=form_data)
    print(f"Status Code (Expected: 200): {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 200, "Form login should succeed!"
    form_token_resp = r.json()
    assert "access_token" in form_token_resp
    assert form_token_resp["role"] == "clinician"
    assert form_token_resp["full_name"] == "Dr. Maria Santos"
    
    print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
