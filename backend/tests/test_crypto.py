from app.security.crypto import decrypt_bytes, encrypt_bytes, generate_dek, sha256_bytes, unwrap_dek, wrap_dek


def test_encryption_roundtrip():
    dek = generate_dek()
    blob = encrypt_bytes(b"household-document", dek)
    assert decrypt_bytes(blob, dek) == b"household-document"


def test_wrapped_dek_roundtrip():
    dek = generate_dek()
    wrapped, nonce = wrap_dek(dek)
    assert unwrap_dek(wrapped, nonce) == dek


def test_hash_mismatch_detects_tamper():
    original = sha256_bytes(b"original-bytes")
    altered = sha256_bytes(b"tampered-bytes")
    assert original != altered
