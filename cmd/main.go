package main

import (
  "log"
  "net/http"
  "os"
  "path/filepath"
  "fmt"

)

func main() {


  fs := http.FileServer(http.Dir("../web"))

 
  http.Handle("/", fs)
  http.HandleFunc("/map", getPackageHandler)
  http.HandleFunc("/map_struct", getStructsHandler)
  

  log.Println("Listening on :3000...")

  err := http.ListenAndServe(":3000", nil)
  if err != nil {
    log.Fatal(err)
  }
}


func crashHandler(w http.ResponseWriter, r *http.Request, e error) {

	w.WriteHeader(http.StatusInternalServerError)

	json := fmt.Sprintf(`{ "error" : "%s" , code : 500 }`, e)

	w.Write([]byte(json))

}

func getStructsHandler(w http.ResponseWriter, r *http.Request) {
  query := r.URL.Query()
  name := query.Get("name")

  g := os.ExpandEnv("$GOPATH")

  pkgPath := filepath.Join(g, "src", name)
  
  data := genStructJSON(pkgPath)                  

    w.WriteHeader(200)
    w.Write([]byte(data))
}


func getPackageHandler(w http.ResponseWriter, r *http.Request) {
  query := r.URL.Query()
  name := query.Get("name")

  g := os.ExpandEnv("$GOPATH")

  pkgPath := filepath.Join(g, "src", name)
	
	data := genJSON(pkgPath)									

    w.WriteHeader(200)
    w.Write([]byte(data))
}