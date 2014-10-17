package main

import (
	"database/sql"
	"fmt"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/coopernurse/gorp"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"instago2/config"
	"net/http"
	"os"
	"strconv"
)

type Answer struct {
	Id          int    `form:"-" json:"-" db:"id"`
	ApplicantId int    `form:"-" json:"-" db:"applicant_id"`
	Correct     string `form:"correct" json:"correct" db:"correct"`
	Title       string `form:"title" json:"title" db:"title"`
	Choice      string `form:"choice" json:"choice" db:"choice"`
}

type Applicant struct {
	Id           int      `form:"id" json:"id" db:"id"`
	Answers      []Answer `form:"answers" json:"answers" db:"-"`
	NumQuestions int      `form:"numQuestions" json:"numQuestions" db:"num_questions"`
	NumCorrect   int      `form:"numCorrect" json:"numCorrect" db:"num_correct"`
}

func initDb() *gorp.DbMap {
	db, err := sql.Open("sqlite3", "tmp/db.bin")
	if err != nil {
		os.Exit(1)
	}

	dbmap := &gorp.DbMap{Db: db, Dialect: gorp.SqliteDialect{}}
	dbmap.AddTableWithName(Applicant{}, "applicants").SetKeys(true, "Id")
	dbmap.AddTableWithName(Answer{}, "answers").SetKeys(true, "Id")
	err = dbmap.CreateTablesIfNotExists()
	if err != nil {
		os.Exit(1)
	}

	return dbmap
}

func main() {

	m := martini.Classic()

	config.Initialize(m)

	dbmap := initDb()

	m.Use(render.Renderer(render.Options{
		Funcs: []template.FuncMap{
			{
				"heroku": config.IsHeroku,
			},
		},
		Layout: "app",
	}))

	m.Get("/", func(r render.Render) {
		r.HTML(200, "index", nil)
	})

	m.Post("/answers", binding.Bind(Applicant{}), func(w http.ResponseWriter, applicant Applicant) {
		err := dbmap.Insert(&applicant)
		if err != nil {
			fmt.Printf("ERROR: %s\n", err.Error())
		}
		for _, answer := range applicant.Answers {
			answer.ApplicantId = applicant.Id
			err := dbmap.Insert(&answer)
			if err != nil {
				fmt.Printf("ERROR: %s\n", err.Error())
				break
			}
		}
	})

	m.Get("/admin", func(w http.ResponseWriter, r render.Render) {
		r.HTML(200, "admin", nil)
	})

	m.Get("/applicants", func(w http.ResponseWriter, r render.Render) {
		var applicants []Applicant
		_, err := dbmap.Select(&applicants, "SELECT * FROM applicants")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		r.JSON(200, applicants)
	})

	m.Get("/applicants/:id", func(w http.ResponseWriter, p martini.Params, r render.Render) {
		id, err := strconv.Atoi(p["id"])
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var answers []Answer
		_, err = dbmap.Select(&answers, "SELECT * FROM answers WHERE applicant_id=?", id)
		r.JSON(200, answers)
	})

	m.Run()
}
