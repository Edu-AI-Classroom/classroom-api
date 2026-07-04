# Agora RTC Frontend Integration Guide

This guide describes the Phase 1 frontend flow for the classroom live call.

## What Frontend Can Integrate Now

- Create or open a live session
- Request RTC token from backend
- Join Agora channel
- Publish/unpublish mic and camera
- Handle remote user join/leave
- Refresh token before expiry
- Teacher moderation:
  - promote student to speaker
  - demote student back to audience
  - end session

## Environment Needed in Frontend

- `NEXT_PUBLIC_API_URL` or equivalent backend base URL
- `NEXT_PUBLIC_AGORA_APP_ID` only if your Agora SDK requires client-side appId

Do not expose `AGORA_APP_CERTIFICATE` to frontend.

## Recommended Frontend Flow

### 1. Load session details

When opening a classroom live page:

1. Fetch classroom details.
2. Fetch live sessions for that classroom.
3. Pick the active session or allow teacher to create one.

### 2. Request token before join

Call:

`POST /agora/classrooms/:classId/sessions/:sessionId/token?speaker=true|false`

Rules:

- teacher: use `speaker=true`
- student: use `speaker=false`
- if teacher promotes a student, request token again with `speaker=true`

### 3. Join Agora

Use response data:

- `rtcToken`
- `channelName`
- `uid`

After Agora join succeeds:

1. call backend `POST /join`
2. initialize local tracks
3. publish if role is `PUBLISHER`

### 4. Leave Agora

On user exit or page unload:

1. call Agora leave
2. call backend `POST /leave`
3. release local tracks

### 5. Refresh token

Schedule refresh using `expireAt`.

Recommended behavior:

- refresh around 2 to 5 minutes before expiry
- if refresh fails, force re-auth or show reconnect state

## Teacher UX

Teacher page should expose:

- create live session
- join host room
- see list of participants
- mute camera/mic controls in UI
- promote student to speaker
- end session

## Student UX

Student page should expose:

- join as audience
- request permission to speak
- show current speaker permission state
- allow re-fetch token after promotion

## Suggested Client State

Keep these states in the frontend:

- `classId`
- `sessionId`
- `channelName`
- `uid`
- `rtcToken`
- `role`
- `joined`
- `publishingAudio`
- `publishingVideo`
- `participants[]`
- `tokenExpireAt`

## Suggested SDK Event Mapping

Map Agora events to UI state:

- join success -> mark local user joined
- user published -> subscribe and render track
- user unpublished -> hide track
- user joined -> add to roster
- user offline -> remove from roster
- token will expire -> call backend for new token

## Minimal Integration Sequence

```text
login -> open class -> load session -> request token -> join Agora -> publish tracks -> track remote users -> refresh token -> leave
```

## Important Backend Constraints

- Session state is in-memory right now, so a backend restart clears live session metadata.
- Only teacher/admin should call moderation endpoints.
- Student should not request publish token unless teacher has promoted them.

## Suggested UI Components

- `LiveRoomPage`
- `AgoraStage`
- `ParticipantRoster`
- `MicToggle`
- `CameraToggle`
- `RaiseHandButton`
- `TeacherControls`
- `TokenRefreshBanner`
