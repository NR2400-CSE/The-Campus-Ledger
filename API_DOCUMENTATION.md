# API Documentation — The Campus Ledger

Base URL (local): `http://localhost:3000/api`
Base URL (deployed): `https://<your-vercel-domain>/api`

All request/response bodies are JSON.

---

### GET /items
List items. Optional query params: `type` (`lost`|`found`), `status` (`open`|`claimed`).

**Example:** `GET /items?type=lost&status=open`

**200 Response**
```json
{ "items": [ { "id": "uuid", "type": "lost", "title": "Black wallet", "description": "...",
  "category": "Bag / Bottle", "location": "Library", "contact": "abc@vitstudent.ac.in",
  "status": "open", "created_at": "2026-08-20T10:00:00Z" } ] }
```

---

### POST /items
Create a new entry.

**Request body**
```json
{ "type": "lost", "title": "Black wallet", "description": "Leather, has a college ID inside",
  "category": "Bag / Bottle", "location": "Library, 2nd floor", "contact": "abc@vitstudent.ac.in" }
```

**201 Response** → `{ "item": { ...created row } }`
**400 Response** → `{ "error": "type, title, description, category, location and contact are all required" }`

---

### GET /items/:id
Fetch a single entry by id.

**200 Response** → `{ "item": { ... } }`
**404 Response** → `{ "error": "..." }`

---

### PUT /items/:id
Update any subset of: `title`, `description`, `category`, `location`, `contact`, `status`.
Used by the UI's "Mark claimed" button as `{ "status": "claimed" }`.

**200 Response** → `{ "item": { ...updated row } }`

---

### DELETE /items/:id
Deletes the entry permanently.

**200 Response** → `{ "message": "Item deleted" }`

---

## Status codes used

| Code | Meaning |
|------|---------|
| 200  | Success (read/update/delete) |
| 201  | Created |
| 400  | Validation error (missing/invalid fields) |
| 404  | Item not found |
| 500  | Database/server error |
