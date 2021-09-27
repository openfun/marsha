"""Utils for XMPP server."""
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from django.conf import settings

import jwt
import xmpp


"""
The XEP used to manage a Multi User Chat is XEP-0045 aka MUC.
Spec are available at https://xmpp.org/extensions/xep-0045.html
"""


def _connect():
    """Connect to a XMPP server and return the connection.

    Returns
    -------
    xmpp.Client
        A xmpp client authenticated to a XMPP server.
    """
    jid = xmpp.protocol.JID(settings.XMPP_PRIVATE_ADMIN_JID)

    client = xmpp.Client(server=jid.getDomain(), port=settings.XMPP_PRIVATE_SERVER_PORT)
    client.connect()
    client.auth(
        user=jid.getNode(),
        password=settings.XMPP_PRIVATE_SERVER_PASSWORD,
        resource=jid.getResource(),
    )

    return client


def create_room(room_name):
    """Create and configure a room.

    Documentation to create and configure a room:
    https://xmpp.org/extensions/xep-0045.html#createroom-reserved

    Parameters
    ----------
    room_name: string
        The name of the room you want to create.
    """
    client = _connect()

    client.send(
        xmpp.Presence(
            to=f"{room_name}@{settings.XMPP_CONFERENCE_DOMAIN}/admin",
            payload=[xmpp.Node(tag="x", attrs={"xmlns": xmpp.NS_MUC})],
        )
    )

    # request the default config when a room is created
    default_config_iq = client.SendAndWaitForResponse(
        xmpp.Iq(
            to=f"{room_name}@{settings.XMPP_CONFERENCE_DOMAIN}",
            frm=settings.XMPP_PRIVATE_ADMIN_JID,
            typ="get",
            queryNS=xmpp.NS_MUC_OWNER,
        )
    )

    data = []
    fileds_to_exclude = [
        "muc#roomconfig_persistentroom",
        "muc#roomconfig_publicroom",
        "muc#roomconfig_allowpm",
        "muc#roomconfig_allowinvites",
        "muc#roomconfig_changesubject",
    ]

    # Remove config we want to modify
    for children in default_config_iq.getQueryPayload()[0].getChildren():
        if (
            children.getName() == "field"
            and children.getAttr("var") not in fileds_to_exclude
        ):
            data.append(children)

    # Add our own config
    data = data + [
        # Room is persistent
        xmpp.DataField(typ="boolean", name="muc#roomconfig_persistentroom", value=1),
        # Room is not publicly searchable
        xmpp.DataField(typ="boolean", name="muc#roomconfig_publicroom", value=0),
        # Nobody can send private message
        xmpp.DataField(
            typ="list-single",
            name="muc#roomconfig_allowpm",
            value="none",
        ),
        # Room invitations are disabled
        xmpp.DataField(typ="boolean", name="muc#roomconfig_allowinvites", value=0),
        # Nobody can change the subject
        xmpp.DataField(typ="boolean", name="muc#roomconfig_changesubject", value=0),
    ]

    client.send(
        xmpp.Iq(
            to=f"{room_name}@{settings.XMPP_CONFERENCE_DOMAIN}",
            frm=settings.XMPP_PRIVATE_ADMIN_JID,
            typ="set",
            queryNS=xmpp.NS_MUC_OWNER,
            payload=[
                xmpp.DataForm(
                    typ="submit",
                    data=data,
                )
            ],
        )
    )


def close_room(room_name):
    """Close a room to anonymous users.

    members only documentation:
    https://xmpp.org/extensions/xep-0045.html#enter-members

    Parameters
    ----------
    room_name: string
        The name of the room you want to destroy.
    """
    client = _connect()

    client.send(
        xmpp.Presence(
            to=f"{room_name}@{settings.XMPP_CONFERENCE_DOMAIN}/admin",
            payload=[xmpp.Node(tag="x", attrs={"xmlns": xmpp.NS_MUC})],
        )
    )

    client.send(
        xmpp.Iq(
            to=f"{room_name}@{settings.XMPP_CONFERENCE_DOMAIN}",
            frm=settings.XMPP_PRIVATE_ADMIN_JID,
            typ="set",
            queryNS=xmpp.NS_MUC_OWNER,
            payload=[
                xmpp.DataForm(
                    typ="submit",
                    data=[
                        xmpp.DataField(
                            typ="hidden", name="FORM_TYPE", value=xmpp.NS_MUC_ROOMCONFIG
                        ),
                        xmpp.DataField(
                            typ="boolean", name="muc#roomconfig_membersonly", value=1
                        ),
                    ],
                )
            ],
        )
    )


def generate_jwt(room_name, user_id, affiliation, expires_at):
    """Generate the JWT token used by xmpp server.

    Parameters
    ----------
    room_name: string
        The name of the room the token is associated with

    user_id: string
        User's id who try to access to the XMPP conference

    affiliations: string
        User affiliation (owner or member)

    expires_at: number
        Expiration time in timestamp format
    """
    return jwt.encode(
        {
            "context": {
                "user": {
                    "id": user_id,
                    "affiliation": affiliation,
                },
            },
            "aud": settings.XMPP_JWT_AUDIENCE,
            "iss": settings.XMPP_JWT_ISSUER,
            "sub": settings.XMPP_DOMAIN,
            "room": room_name,
            "exp": expires_at,
        },
        settings.XMPP_JWT_SHARED_SECRET,
    )


def add_jwt_token_to_url(url, token):
    """Add a JWT token to a XMPP url."""
    if url is None:
        return None

    generated_url = list(urlparse(url))
    generated_query_string = dict(parse_qs(generated_url[4]))
    generated_query_string.update({"token": token})
    generated_url[4] = urlencode(generated_query_string)

    return urlunparse(generated_url)
