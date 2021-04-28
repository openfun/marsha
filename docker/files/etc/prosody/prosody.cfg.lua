-- Prosody XMPP Server Configuration
--
-- Information on configuring Prosody can be found on our
-- website at https://prosody.im/doc/configure
--
-- Tip: You can check that the syntax of this file is correct
-- when you have finished by running this command:
--     prosodyctl check config
-- If there are any errors, it will let you know what and where
-- they are, otherwise it will keep quiet.
--
-- Good luck, and happy Jabbering!


---------- Server-wide settings ----------
-- Settings in this section apply to the whole server and are the default settings
-- for any virtual hosts

-- Prosody will always look in its source directory for modules, but
-- this option allows you to specify additional locations where Prosody
-- will look for modules first. For community modules, see https://modules.prosody.im/
plugin_paths = { "/usr/share/prosody/modules" }

-- The daemonize and pidfile are used to run prosody in foreground
daemonize = false
pidfile = "prosody.pid"

-- This is a (by default, empty) list of accounts that are admins
-- for the server. Note that you must create the accounts separately
-- (see https://prosody.im/doc/creating_accounts for info)
-- Example: admins = { "user1@example.com", "user2@example.net" }
admins = { }



-- Enable use of libevent for better performance under high load
-- For more information see: https://prosody.im/doc/libevent
use_libevent = true


cross_domain_bosh = true
consider_bosh_secure = true

-- This is the list of modules Prosody will load on startup.
-- It looks for mod_modulename.lua in the plugins folder, so make sure that exists too.
-- Documentation for bundled modules can be found at: https://prosody.im/doc/modules
modules_enabled = {
  "roster";
  "saslauth";
  "dialback";
  "disco";
  "carbons";
  "pep";
  "private";
  "blocklist";
  "vcard4";
  "vcard_legacy";
  "version";
  "uptime";
  "time";
  "ping";
  "register";
  "admin_adhoc";
}

-- These modules are auto-loaded, but should you want
-- to disable them then uncomment them here:
modules_disabled = {}

-- Disable account creation by default, for security
-- For more information see https://prosody.im/doc/creating_accounts
allow_registration = false

-- Force clients to use encrypted connections? This option will
-- prevent clients from authenticating unless they are using encryption.

c2s_require_encryption = false
allow_unencrypted_plain_auth = true

-- Force servers to use encrypted connections? This option will
-- prevent servers from authenticating unless they are using encryption.

s2s_require_encryption = false

-- Force certificate authentication for server-to-server connections?

s2s_secure_auth = false

-- Some servers have invalid or self-signed certificates. You can list
-- remote domains here that will not be required to authenticate using
-- certificates. They will be authenticated using DNS instead, even
-- when s2s_secure_auth is enabled.

s2s_insecure_domains = { }

-- Even if you disable s2s_secure_auth, you can still require valid
-- certificates for some domains by specifying a list here.

s2s_secure_domains = { }

-- Required for init scripts and prosodyctl

-- Select the authentication backend to use. The 'internal' providers
-- use Prosody's configured data storage to store the authentication data.

authentication = "internal_hashed" 

-- Select the storage backend to use. By default Prosody uses flat files
-- in its configured data directory, but it also supports more backends
-- through modules. An "sql" backend is included by default, but requires
-- additional dependencies. See https://prosody.im/doc/storage for more info.

storage = "sql"

sql = { 
    driver = "PostgreSQL",
    database = "prosody",
    username = "prosody",
    password = "prosody",
    host = "db",
    port =  5432
  }

-- Archiving configuration
-- If mod_mam is enabled, Prosody will store a copy of every message. This
-- is used to synchronize conversations between multiple clients, even if
-- they are offline. This setting controls how long Prosody will keep
-- messages in the archive before removing them.

archive_expires_after = "1w"

-- You can also configure messages to be stored in-memory only. For more
-- archiving options, see https://prosody.im/doc/modules/mod_mam

-- Logging configuration
-- For advanced logging see https://prosody.im/doc/logging
log = {
	{ levels = {min = "debug"}, to = "console"};
}

-- Uncomment to enable statistics
-- For more info see https://prosody.im/doc/statistics
-- statistics = "internal"

-- Certificates
-- Every virtual host and component needs a certificate so that clients and
-- servers can securely verify its identity. Prosody will automatically load
-- certificates/keys from the directory specified here.
-- For more information, including how to use 'prosodyctl' to auto-import certificates
-- (from e.g. Let's Encrypt) see https://prosody.im/doc/certificates

-- Location of directory to find certificates in (relative to main config file):
certificates = "certs"

-- HTTPS currently only supports a single certificate, specify it here:
--https_certificate = "/etc/prosody/certs/localhost.crt"

asap_accepted_issuers = { "marsha" }
asap_accepted_audiences = { "marsha" }

----------- Virtual hosts -----------
-- You need to add a VirtualHost entry for each domain you wish Prosody to serve.
-- Settings under each VirtualHost entry apply *only* to that host.

VirtualHost "prosody"
    authentication = "token"
    -- Properties below are modified by jitsi-meet-tokens package config
    -- and authentication above is switched to "token"
    app_id="marsha"
    app_secret="ThisIsNotAPrivateProsodyJwtSigningKey"

    allow_empty_token = false;  
    modules_enabled = {
        "bosh";
    }
    c2s_require_encryption = false

VirtualHost "prosody-app"
    authentication = "internal_hashed"
    admins = { "admin@prosody-app" }


------ Components ------
-- You can specify components to add hosts that provide special services,
-- like multi-user conferences, and transports.
-- For more information on components, see https://prosody.im/doc/components

---Set up a MUC (multi-user chat) room server on conference.example.com:
Component "conference.prosody" "muc"
    modules_enabled = { "muc_mam", "token_verification", "token_affiliation" }
    admins = { "admin@prosody-app" }
    restrict_room_creation = true
    muc_room_default_persistent = true
    log_all_rooms = true



