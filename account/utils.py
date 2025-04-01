import random
import string

def gen_verification_code(length=10):
    """
    Generate a random verification code of specified length using non-ambiguous characters.
    """
    chars = ''.join(c for c in string.ascii_letters + string.digits if c not in '0oO1lI5S2Z8B6G9gcCuvmn')
    return ''.join(random.choice(chars) for _ in range(length))
