"""For development purpose only, load a set of datasets in the database."""

from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.transaction import atomic

from marsha.bbb.factories import ClassroomFactory
from marsha.core.factories import (
    ConsumerSiteFactory,
    DocumentFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PortabilityRequestFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    STUDENT,
    ConsumerSite,
    ConsumerSiteAccess,
    ConsumerSiteOrganization,
    Organization,
    OrganizationAccess,
    Playlist,
    PlaylistAccess,
)
from marsha.deposit.factories import FileDepositoryFactory
from marsha.markdown.factories import MarkdownDocumentFactory


User = get_user_model()


class Command(BaseCommand):
    """Create useful data for development purpose."""

    help = __doc__
    admin_username = "admin"

    def add_arguments(self, parser):
        """
        Add arguments to management command:
         - allow to run command without dropping the database existing data.
        """
        parser.add_argument(
            "--flush-db",
            action="store_true",
            help="Remove all data in database before creating development dataset",
            default=False,
        )

    @atomic
    def handle(self, *args, **options):
        """Execute management command."""

        if options["flush_db"]:
            self.stdout.write("Flushing database...")
            call_command(
                "flush",
                verbosity=3,
                interactive=False,
                reset_sequences=True,
                allow_cascade=True,
                inhibit_post_migrate=True,
            )
            self.stdout.write(" - done.")

        self._create_site()
        self._create_superuser()  # warning: defines self.superuser
        self._create_users()  # warning: defines self.consumer_site_admin, etc.
        localhost_cs = self._create_consumer_sites()
        organization = self._create_organizations(localhost_cs)
        self._create_playlists(localhost_cs, organization)

    def _create_site(self):
        Site.objects.get_or_create(domain="localhost:8060", defaults={"name": "Marsha"})

    def _create_superuser(self):
        """Create a superuser, required for the command."""
        self.stdout.write("Creating superuser...")

        try:
            user = User.objects.get(username=self.admin_username)
            self.stdout.write(" - superuser already exists.")
        except User.DoesNotExist:
            user = User.objects.create_superuser(
                username=self.admin_username,
                email=f"{self.admin_username}@example.com",
                password=self.admin_username,
            )
            self.stdout.write(" - done.")

        # This method must then be called before the other ones
        self.superuser = user  # pylint: disable=attribute-defined-outside-init

    def _create_users(self):
        """Create users, required for the command"""
        for username in (
            "consumer_site_admin",
            "consumer_site_instructor",
            "consumer_site_student",
            "organization_admin",
            "organization_instructor",
            "organization_student",
            "playlist_admin",
            "playlist_instructor",
            "playlist_student",
            "instructor",
        ):
            self.stdout.write(f"Creating {username}...")

            try:
                user = User.objects.get(username=username)
                self.stdout.write(f" - {username} already exists.")
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=username,
                    last_name=username,
                    email=f"{username}@example.com",
                    password=username,
                )
                self.stdout.write(" - done.")

            # Be careful, we are creating new class properties on the fly
            # They will be available and *used* in the other methods
            # This method must then be called before the other ones
            setattr(self, username, user)  # warning: magic here

    def _create_consumer_sites(self):
        """Create the localhost consumer site along with other random ones"""
        self.stdout.write("Creating consumer sites...")
        localhost_cs, created = ConsumerSite.objects.get_or_create(
            domain="localhost",  # be consitent with the LTI development view
            defaults={
                "name": "localhost",
            },
        )
        ConsumerSiteAccess.objects.get_or_create(
            consumer_site=localhost_cs,
            user=self.consumer_site_admin,
            defaults={
                "role": ADMINISTRATOR,
            },
        )
        ConsumerSiteAccess.objects.get_or_create(
            consumer_site=localhost_cs,
            user=self.consumer_site_instructor,
            defaults={
                "role": INSTRUCTOR,
            },
        )
        for username in (
            "consumer_site_student",
            "organization_admin",
            "organization_instructor",
            "organization_student",
            "playlist_admin",
            "playlist_instructor",
            "playlist_student",
        ):
            ConsumerSiteAccess.objects.get_or_create(
                consumer_site=localhost_cs,
                user=getattr(self, username),
                defaults={
                    "role": STUDENT,
                },
            )

        # generate random customer sites
        if created:  # otherwise we consider we have already generated data
            ConsumerSiteFactory.create_batch(5)

        self.stdout.write(" - done.")
        return localhost_cs

    def _create_organizations(self, localhost_cs):
        """Create the marsha organization along with other random ones"""
        self.stdout.write("Creating organizations...")
        organization, created = Organization.objects.get_or_create(
            name="Marsha organization",
        )
        ConsumerSiteOrganization.objects.get_or_create(
            organization=organization,
            consumer_site=localhost_cs,
        )

        OrganizationAccess.objects.get_or_create(
            organization=organization,
            user=self.organization_admin,
            defaults={
                "role": ADMINISTRATOR,
            },
        )
        OrganizationAccess.objects.get_or_create(
            organization=organization,
            user=self.organization_instructor,
            defaults={
                "role": INSTRUCTOR,
            },
        )
        for username in (
            "organization_student",
            "playlist_admin",
            "playlist_instructor",
            "playlist_student",
        ):
            OrganizationAccess.objects.get_or_create(
                organization=organization,
                user=getattr(self, username),
                defaults={
                    "role": STUDENT,
                },
            )

        # generate random customer sites
        if created:  # otherwise we consider we have already generated data
            OrganizationFactory.create_batch(5)

        self.stdout.write(" - done.")
        return organization

    def _create_playlists(self, localhost_cs, organization):
        """Create various playlist with random resources."""
        self.stdout.write("Creating playlists...")
        playlist_admin, created = Playlist.objects.get_or_create(
            title="Playlist created by admin",
            consumer_site=localhost_cs,
            organization=organization,
            created_by=self.superuser,
            lti_id="course-v1:playlist+created+by+admin",
            is_portable_to_playlist=False,
        )
        if created:
            self._populate_playlist(playlist_admin)

        playlist_admin_permission, created = Playlist.objects.get_or_create(
            title="admin user playlist",
            consumer_site=localhost_cs,
            organization=organization,
            created_by=self.superuser,
            lti_id="course-v1:playlist+for_admin_user",
            is_portable_to_playlist=False,
        )
        if created:
            PlaylistAccess.objects.get_or_create(
                user=self.superuser,
                playlist=playlist_admin_permission,
                role=ADMINISTRATOR,
            )
            self._populate_playlist(playlist_admin_permission)
            # also add random playlists
            PlaylistAccessFactory.create_batch(
                5,
                user=self.superuser,
                role=ADMINISTRATOR,
            )

        playlist_instructor, created = Playlist.objects.get_or_create(
            title="Playlist created by instructor",
            consumer_site=localhost_cs,
            organization=organization,
            created_by=self.instructor,
            lti_id="course-v1:playlist+created+by+instructor",
            is_portable_to_playlist=False,
        )
        if created:
            self._populate_playlist(playlist_instructor)

        playlist, created = Playlist.objects.get_or_create(
            title="Playlist created by unknown user",
            consumer_site=localhost_cs,
            organization=organization,
            lti_id="course-v1:playlist+with+direct+access",
            is_portable_to_playlist=False,
        )
        PlaylistAccess.objects.get_or_create(
            user=self.playlist_admin,
            playlist=playlist,
            role=ADMINISTRATOR,
        )
        PlaylistAccess.objects.get_or_create(
            user=self.playlist_instructor,
            playlist=playlist,
            role=INSTRUCTOR,
        )
        PlaylistAccess.objects.get_or_create(
            user=self.playlist_student,
            playlist=playlist,
            role=STUDENT,
        )

        if created:
            self._populate_playlist(playlist)

        self.stdout.write(" - done.")

    def _populate_playlist(self, playlist):
        """Populate a playlist with "default" resources."""
        ClassroomFactory.create_batch(3, playlist=playlist)
        FileDepositoryFactory.create_batch(3, playlist=playlist)
        DocumentFactory.create_batch(3, playlist=playlist)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist)
        PortabilityRequestFactory.create_batch(8, for_playlist=playlist)
        PortabilityRequestFactory(from_playlist=playlist, from_user=self.superuser)
        VideoFactory.create_batch(3, playlist=playlist)
        WebinarVideoFactory.create_batch(3, playlist=playlist)
