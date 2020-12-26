package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/ioutil"
	"strings"
)

func Exists(arr []string, lookup string) bool {
	for i := 0; i < len(arr); i++ {
		if arr[i] == lookup {
			return true
		}
	}
	return false
}

func genJSON(path string) string {

	fnInterfaceMap := make(map[string][]string)
	fnParamMap := make(map[string]string)
	fnReturnMap := make(map[string]string)

	// Create the AST by parsing src.
	fsettopl := token.NewFileSet() // positions are relative to fset

	var jstrbits string
	pkgs, err := parser.ParseDir(fsettopl, path, nil, parser.ParseComments)
	if err != nil {
		panic(err)
	}
	var jsFinal = "["
	for name, pkg := range pkgs {

		fmt.Println("Processing package :", name)
		for fname, _ := range pkg.Files {

			fset := token.NewFileSet() // positions are relative to fset
			f, err := parser.ParseFile(fset, fname, nil, parser.ParseComments)
			if err != nil {
				panic(err)
			}

			body, err := ioutil.ReadFile(fname)
			if err != nil {
				panic(err)
			}

			strbody := string(body)

			// Create an ast.CommentMap from the ast.File's comments.
			// This helps keeping the association between comments
			// and AST nodes.

			// Remove the first variable declaration from the list of declarations.
			for _, d := range f.Decls {
				if fn, isFn := d.(*ast.FuncDecl); isFn {
					if fn.Doc != nil {
						if len(fn.Doc.List) > 0 {
							var comments = make([]string, len(fn.Doc.List), len(fn.Doc.List))

							for i, cmment := range fn.Doc.List {
								comments[i] = cmment.Text
							}

							fnString := strbody[(fn.Type.Pos() - 1):(fn.Type.End() - 1)]

							partsstr := strings.Split(fnString, fn.Name.Name)

							if strings.Contains(partsstr[0], ")") {
								partssub := strings.Split(strings.TrimSpace(partsstr[0]), " ")
								if _, exts := fnInterfaceMap[fn.Name.Name]; !exts {
									fnInterfaceMap[fn.Name.Name] = []string{}
								}

								intname := strings.Replace(strings.Replace(strings.TrimSpace(partssub[len(partssub)-1]), ")", "", -1), "*", "", -1)
								if strings.Contains(fnString, "*") {
									intname = fmt.Sprintf(`*%s`, intname)
								}
								if !Exists(fnInterfaceMap[fn.Name.Name], intname) {

									fnInterfaceMap[fn.Name.Name] = append(fnInterfaceMap[fn.Name.Name], intname)

								}
							}

							if fn.Type.Params != nil {

								strret := ""
								limtlen := len(fn.Type.Params.List) - 1
								for indx, fieldss := range fn.Type.Params.List {

									limtlenv := len(fieldss.Names) - 1
									typeExpr := fieldss.Type
									start := typeExpr.Pos() - 2
									end := typeExpr.End() - 1
									for indxv, fieldnamesubs := range fieldss.Names {
										strret += fmt.Sprintf("%s%s", fieldnamesubs, strbody[start:end])
										if indxv < limtlenv {
											strret += ","
										}
									}

									if indx < limtlen {
										strret += ","
									}
								}
								fnParamMap[fn.Name.Name] = strret
							}

							if fn.Type.Results != nil {
								strret := ""
								limtlen := len(fn.Type.Results.List) - 1
								for indx, fieldss := range fn.Type.Results.List {
									limtlenv := len(fieldss.Names) - 1
									typeExpr := fieldss.Type
									start := typeExpr.Pos() - 2
									end := typeExpr.End() - 1
									for indxv, fieldnamesubs := range fieldss.Names {
										strret += fmt.Sprintf("%s%s", fieldnamesubs, strbody[start:end])
										if indxv < limtlenv {
											strret += ","
										}
									}

									if indx < limtlen {
										strret += ","
									}
								}
								if strret != "" {
									fnReturnMap[fn.Name.Name] = strret
								} else {
									fnReturnMap[fn.Name.Name] = "result "
									fmt.Println("No named returned variable found, assume your result to be in json key `result`.")
								}
							}

							
							interfaceMap := fnInterfaceMap
							_, hasmap := interfaceMap[fn.Name.Name]
			
							if !hasmap {
								jstrbits += fmt.Sprintf(`{
									"name" :  "%s",
									"comment" : "%s",
									"namespace" : "%s",			
									"params" : "%s",
									"returns" : "%s"
								},
									`,
									fn.Name.Name, 
									strings.Join(comments, "\n"),
									name,
									fnParamMap[fn.Name.Name],
									fnReturnMap[fn.Name.Name],
								)
							}


						}
					}
				}
			}

			jsFinal += jstrbits
		}
	}

	jsFinal += "{}]"
	fmt.Println(jsFinal)

	return jsFinal
}
