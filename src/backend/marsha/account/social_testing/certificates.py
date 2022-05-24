"""Module to generate certificates for test and development use"""
try:
    from functools import cache
except ImportError:
    # For python < 3.9 we use the LRU cache
    from functools import lru_cache as cache

from OpenSSL import crypto


@cache
def _generate_dev_certificate():
    """
    Generate a self-signed certificate, which must only be
    used for development/testing purpose.

    Returns
    -------
    Tuple[str, str]
        This returns a ready to use in Python Social Auth
        private key and public certificate.
        ```
        (<private_key>, <certificate>)
        ```
    """
    # Initiate a key pair
    key_pair = crypto.PKey()
    key_pair.generate_key(crypto.TYPE_RSA, 4096)

    # Generate a self-signed cert
    cert = crypto.X509()

    # Define the subject (not important)
    subject = cert.get_subject()
    subject.countryName = "FR"
    subject.stateOrProvinceName = "IDF"
    subject.localityName = "Paris"
    subject.organizationName = "FUN"
    subject.organizationalUnitName = "Marsha"
    subject.commonName = "commonName"
    subject.emailAddress = "tech@example.com"

    # Complete certificate definition
    cert.set_serial_number(0)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(365 * 24 * 60 * 60)  # 1 year
    cert.set_issuer(subject)
    cert.set_pubkey(key_pair)
    cert.sign(key_pair, "sha512")

    certificate = crypto.dump_certificate(crypto.FILETYPE_PEM, cert).decode("utf-8")
    private_key = crypto.dump_privatekey(crypto.FILETYPE_PEM, key_pair).decode("utf-8")
    return private_key, certificate


def get_dev_private_key():
    """Get the generated private key"""
    return _generate_dev_certificate()[0]


def get_dev_certificate():
    """Get the generated certificate"""
    return _generate_dev_certificate()[1]
