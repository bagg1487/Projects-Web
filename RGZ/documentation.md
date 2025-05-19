# Полная спецификация API v1.0

## Базовый URL
`http://yourdomain.com/api/v1`

## Аутентификация
### Регистрация пользователя
`POST /auth/register`

**Параметры:**
```json
{
  "username": "string (3-20 chars, уникальный)",
  "password": "string (мин. 8 символов)"
}
```

**Ответы:**
- `201 Created`:
```json
{
  "status": "success",
  "user_id": 123
}
```
- `400 Bad Request` (ошибки валидации)
- `409 Conflict` (пользователь существует)

### Авторизация
`POST /auth/login`

**Параметры:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Ответы:**
- `200 OK` (устанавливает session cookie):
```json
{
  "status": "success",
  "username": "testuser"
}
```
- `401 Unauthorized` (неверные данные)

## Пользовательские данные
### Получить профиль
`GET /users/{id}`

**Заголовки:**
```
Authorization: Bearer {token}
```

**Ответы:**
- `200 OK`:
```json
{
  "id": 123,
  "username": "testuser",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Коды ошибок
| Код | Ситуация |
|-----|----------|
| 400 | Некорректный запрос |
| 401 | Неавторизованный доступ |
| 404 | Ресурс не найден |
| 500 | Серверная ошибка |
