# Agora RTC API Contract

Backend contract for Phase 1 live classroom video calls.

## Auth

All endpoints below require JWT auth unless noted otherwise.

- Header: `Authorization: Bearer <access_token>`
- Role checks:
  - `TEACHER` can create/end sessions and update participant publish permissions.
  - `STUDENT` can join live sessions and request tokens.

## Data Model

- `classId`: classroom ID from the existing classroom module.
- `sessionId`: Agora session UUID created by backend.
- `channelName`: derived value used by Agora RTC. Format:
  - `classroom_<classId>_<sessionId>`

## Endpoints

### Create live session

`POST /agora/classrooms/:classId/sessions`

Request body:

```json
{
  "title": "Unit 3 live lecture",
  "scheduledStartAt": "2026-07-04T08:00:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Agora session created successfully",
  "data": {
    "sessionId": "7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb",
    "classId": 1,
    "channelName": "classroom_1_7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb",
    "status": "ACTIVE",
    "createdByUserId": 1001,
    "createdByUserName": "Nguyen Van A",
    "title": "Unit 3 live lecture",
    "scheduledStartAt": "2026-07-04T08:00:00.000Z",
    "startedAt": "2026-07-04T08:01:10.000Z",
    "endedAt": null,
    "participantCount": 0,
    "attendanceCount": 0,
    "participants": []
  },
  "timestamp": "2026-07-04T08:01:10.000Z",
  "path": "/agora/classrooms/1/sessions"
}
```

### List sessions for a classroom

`GET /agora/classrooms/:classId/sessions`

Response: array of `AgoraSessionDto`.

### Get one session

`GET /agora/classrooms/:classId/sessions/:sessionId`

Response: `AgoraSessionDto`.

### Issue RTC token

`POST /agora/classrooms/:classId/sessions/:sessionId/token?speaker=true|false`

Response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Agora token issued successfully",
  "data": {
    "rtcToken": "007...",
    "channelName": "classroom_1_7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb",
    "uid": 1001,
    "role": "PUBLISHER",
    "expireAt": "2026-07-04T09:01:10.000Z"
  },
  "timestamp": "2026-07-04T08:01:10.000Z",
  "path": "/agora/classrooms/1/sessions/7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb/token"
}
```

Notes:

- `speaker=true` requests publish privileges.
- Students should only request `speaker=true` after teacher promotion.
- Teachers automatically receive publish privileges.

### Mark join

`POST /agora/classrooms/:classId/sessions/:sessionId/join`

Use this after Agora join succeeds to update attendance state.

### Mark leave

`POST /agora/classrooms/:classId/sessions/:sessionId/leave`

Use this when user exits the call or the UI closes the room.

### Update participant publish permission

`PATCH /agora/classrooms/:classId/sessions/:sessionId/participants/:participantId`

Request body:

```json
{
  "speakerEnabled": true
}
```

### End live session

`POST /agora/classrooms/:classId/sessions/:sessionId/end`

Marks the session as ended. Frontend should stop join attempts after this.

## Response Shapes

### `AgoraTokenDto`

- `rtcToken`: Agora RTC access token
- `channelName`: channel to join
- `uid`: numeric user ID
- `role`: `PUBLISHER` or `SUBSCRIBER`
- `expireAt`: ISO timestamp for refresh scheduling

### `AgoraSessionDto`

- `sessionId`
- `classId`
- `channelName`
- `status`
- `createdByUserId`
- `createdByUserName`
- `title`
- `scheduledStartAt`
- `startedAt`
- `endedAt`
- `participantCount`
- `attendanceCount`
- `participants[]`

### `AgoraParticipantDto`

- `userId`
- `userName`
- `role`
- `speakerEnabled`
- `joinedAt`
- `leftAt`

## Error Cases

- `401` missing/invalid JWT
- `403` user not allowed in classroom or not a teacher for moderation routes
- `404` session not found
- `503` Agora env missing on backend

## Important Implementation Note

Live session state is currently stored in memory. This means:

- sessions are lost on backend restart
- attendance is only best-effort until DB persistence is added
