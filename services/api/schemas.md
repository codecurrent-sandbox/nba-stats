# API Schemas

## Player Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Player",
  "type": "object",
  "required": ["id", "firstName", "lastName", "position"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique player identifier"
    },
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "position": {
      "type": "string",
      "enum": ["PG", "SG", "SF", "PF", "C"],
      "description": "Player position: Point Guard, Shooting Guard, Small Forward, Power Forward, Center"
    },
    "number": {
      "type": "integer",
      "minimum": 0,
      "maximum": 99
    },
    "height": {
      "type": "string",
      "pattern": "^\\d{1,2}'\\d{1,2}\"$"
    },
    "weight": {
      "type": "integer",
      "minimum": 150,
      "maximum": 400
    },
    "dateOfBirth": {
      "type": "string",
      "format": "date"
    },
    "college": {
      "type": "string",
      "maxLength": 200
    }
  }
}
```

## Team Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Team",
  "type": "object",
  "required": ["id", "name", "abbreviation"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "abbreviation": {
      "type": "string",
      "minLength": 2,
      "maxLength": 3,
      "pattern": "^[A-Z]{2,3}$"
    },
    "city": {
      "type": "string",
      "maxLength": 100
    },
    "founded": {
      "type": "integer",
      "minimum": 1946,
      "maximum": 2100
    }
  }
}
```

## Game Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Game",
  "type": "object",
  "required": ["id", "homeTeam", "awayTeam", "date"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "homeTeam": {
      "$ref": "#/definitions/Team"
    },
    "awayTeam": {
      "$ref": "#/definitions/Team"
    },
    "date": {
      "type": "string",
      "format": "date-time"
    },
    "homeScore": {
      "type": "integer",
      "minimum": 0
    },
    "awayScore": {
      "type": "integer",
      "minimum": 0
    },
    "status": {
      "type": "string",
      "enum": ["scheduled", "in-progress", "completed", "cancelled"]
    }
  }
}
```

## Statistics Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PlayerStats",
  "type": "object",
  "properties": {
    "playerId": {
      "type": "string",
      "format": "uuid"
    },
    "season": {
      "type": "integer"
    },
    "gamesPlayed": {
      "type": "integer",
      "minimum": 0
    },
    "pointsPerGame": {
      "type": "number",
      "minimum": 0
    },
    "assistsPerGame": {
      "type": "number",
      "minimum": 0
    },
    "reboundsPerGame": {
      "type": "number",
      "minimum": 0
    },
    "fieldGoalPercentage": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "threePointPercentage": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "freeThrowPercentage": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    }
  }
}
```
