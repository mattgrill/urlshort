urlshort
========

Redis backed Node.js URL shortener (sort of)

Most responses are plain HTTP status codes. On occasion you'll get back some JSON and a status code. 

## Create
```
curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"url":"http://www.google.com"}' http://localhost:3000
```
```javascript
{
  "original_url": "http://www.google.com",
  "key": "ePYPhSR_tM",
  "token": "5465bd75d890ca7a"
}
```

## Read
```
curl http://localhost:3000/ePYPhSR_tM

Moved Permanently. Redirecting to http://www.google.com
```

## Delete
```
curl -H "Accept: application/json" -H "Content-type: application/json" -X DELETE -d '{"hash":"ePYPhSR_tM","authtoken":"5465bd75d890ca7a"}' http://localhost:3000
```
```javascript
{
  "message": "OK"
}
```


