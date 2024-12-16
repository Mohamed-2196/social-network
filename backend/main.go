package main

import (
	"fmt"
	"net/http"

	"main.go/handlers"
)

func main() {
	mux := http.NewServeMux()
	handlers.AddHandlers(mux)
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		fmt.Println(err)

	}
}
