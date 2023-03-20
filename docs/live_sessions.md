# Live sessions

Marsha provides a way to track student activity during a live. 
It is done by creating a "live session" when the student starts watching the live 
or registers to it.

It slowly evolved to become a way to store the student attendance to a live and extract 
an "attendance sheet" (a report telling who watched the live) for the instructor.

The "live session" also stores the "display name" of the student which is displayed
in the attendance sheet and the chat. The attendance sheet displays the student's display name and username.

For the public lives, the "live session" can be defined as anonymous because the student
is not required to be logged in to watch the live. In this case, the session has an `anonymous_id`
and the authentication is made through a ResourceToken (ie LTI like) or a UserToken (standalone).
Though Is is theoretically possible that the standalone site uses a ResourceToken,
we should not encounter this case.


## Live session model

The live session model can be either:

- anonymous: the student is not required to be logged in to watch the live. 
  In this case, the live session has an `anonymous_id`.
- from LTI: the session has a `lti_user_id`, a `lti_id` and a `consumer_site` which are mandatory filled
  and provides the unicity of a live session per student.
- from standalone site: the session has a `user` which is mandatory and provides the unicity of a live session 
  per student.
