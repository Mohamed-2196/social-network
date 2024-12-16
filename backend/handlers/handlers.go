package handlers

import (
	"net/http"
)

func AddHandlers(mux *http.ServeMux) {
	mux.HandleFunc("GET /group", HandleGroupChat)
}
