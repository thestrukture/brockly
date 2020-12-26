package main

import (
	"fmt"
	"go/parser"
	"go/token"
	"go/ast"
	"strings"
)

func genStructJSON(path string) string {
    
    fsettopl := token.NewFileSet() // positions are relative to fset
	pkgs, err := parser.ParseDir(fsettopl, path, nil, parser.ParseComments)
	if err != nil {
		panic(err)
	}

	jsFinal := "["

	for name, pkg := range pkgs {

		fmt.Println("Processing package :", name)
		for fname, _ := range pkg.Files {

			fset := token.NewFileSet() // positions are relative to fset
			f, err := parser.ParseFile(fset, fname, nil, parser.ParseComments)
			if err != nil {
				panic(err)
			}

			for _, d := range f.Decls {

				if _, v := d.(*ast.GenDecl); v {

					typeDecl := d.(*ast.GenDecl)
	    			typeInfoDecl,ok := typeDecl.Specs[0].(*ast.TypeSpec)

	    			if ok {
	    			
	    				structDecl,isStruct := typeInfoDecl.Type.(*ast.StructType)

	    								
	    				if isStruct {

	    					var comments = []string{}

	    					if typeDecl.Doc != nil &&  typeDecl.Doc.List != nil {
								for _, cmment := range typeDecl.Doc.List {
									comments = append(comments, cmment.Text) 
								}
							}

	    					fmt.Println(typeInfoDecl.Name.Name, structDecl)

	    					var fieldString = "["

	    					for _, field := range structDecl.Fields.List {

					            fieldString += fmt.Sprintf(`{
									"name" :  "%s",
									"type" : "%s"		
								},
									`,
									field.Names[0].Name, 
									field.Type,
								)
					        }

	    					fieldString += "{}]"

	    					jsFinal += fmt.Sprintf(`{
									"name" :  "%s",
									"comment" : "%s",
									"fields" : %s,
									"namespace" : "%s"			
								},
									`,
									typeInfoDecl.Name.Name, 
									strings.Join(comments, "\n"),
									fieldString,
									name,
							)
	    				}
	    			}
    			}
			}
		    
			
			
		}

	}

	jsFinal += "{}]"

	return jsFinal
}
