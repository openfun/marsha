export interface DecodedJwt {
  context_id: string;
  email: string;
  roles: string[];
  session_id: string;
  user_id: string;
  video_id: string;
}
