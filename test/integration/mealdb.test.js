process.env["DB_DATABASE"] = process.env.DB_DATABASE || "shareameal-testdb";

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const assert = require("assert");
const pool = require("../../src/util/database");
const jwt = require("jsonwebtoken");
const { jwtSecretKey, logger } = require("../../src/util/utils");
require("tracer").setLevel("trace");

chai.should();
chai.use(chaiHttp);

const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_DB =
  CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

//   insert 2 meals

const INSERT_USER =
  "INSERT INTO user (id, firstName, lastName, isActive, emailAdress, password, phoneNumber, roles, street, city) VALUES (1, 'john', 'doe', 1, 'johan.doe@example.com', 'Welkom123', '06-12345678', 'admin', '28 straat', 'Eindhoven'), (2, 'jane', 'smith', 0, 'jane.smith@example.com', 'Password123', '06-12345678', 'guest', '42 avenue', 'New York');";
const INSERT_MEAL =
  "INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, createDate, updateDate, name, description, allergenes) VALUES (1, 1, 1, 0, 0, '2023-05-20 18:30:00', 8, 15.99, 'https://example.com/image1.jpg', 1, '2023-05-18', '2023-05-18', 'Meal 1', 'This is the description for Meal 1', 'lactose'), (2, 1, 1, 0, 0, '2023-05-20 18:30:00', 8, 12.99, 'https://example.com/image2.jpg', 2, '2023-05-19', '2023-05-19', 'Meal 2', 'This is the description for Meal 2', 'gluten,noten');";
const INSERT = INSERT_USER + INSERT_MEAL;

describe("UC-301 Toevoegen van maaltijd", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      console.log("clear_db: " + err);
      assert(err === null);
      pool.query(INSERT, (err, result) => {
        console.log("insert_meal: " + err);
        assert(err === null);
        done();
      });
    });
  });

  it("TC-301-1 Verplicht veld ontbreekt", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .post("/api/meal")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property(
          "message",
          "Foute invoer van een of meerdere velden"
        );
        done();
      });
  });

  it("TC-301-2 Niet ingelogd", (done) => {
    const token = "";
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .post("/api/meal")
      .send(meal)
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property(
          "message",
          "Authorization header missing!"
        );
        done();
      });
  });

  it("TC-301-3 Maaltijd succesvol toegevoegd", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .post("/api/meal")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        console.log("foutmelding: " + err);
        res.should.have.status(201);
        res.body.should.have.property("message", "Meal created");
        res.body.should.have.property("data");
        res.body.data.should.have.property("meal");
        res.body.data.meal.should.have.property("mealId");
        res.body.data.meal.should.have.property("isActive");
        res.body.data.meal.should.have.property("isVega");
        res.body.data.meal.should.have.property("isVegan");
        res.body.data.meal.should.have.property("isToTakeHome");
        res.body.data.meal.should.have.property("maxAmountOfParticipants");
        res.body.data.meal.should.have.property("price");
        res.body.data.meal.should.have.property("imageUrl");
        res.body.data.meal.should.have.property("cookId");
        res.body.data.meal.should.have.property("name");
        res.body.data.meal.should.have.property("description");
        res.body.data.meal.should.have.property("allergenes");
        done();
        
      });
  });

  after((done) => {
    // Clear the database after testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-302 Wijzigen van maaltijdgegevens", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      console.log("clear_db: " + err);
      assert(err === null);
      pool.query(INSERT, (err, result) => {
        console.log("insert_meal: " + err);
        assert(err === null);
        done();
      });
    });
  });

  it("TC-302-1 Verplicht velden “name” en/of “price”en/of “maxAmountOfParticipants” ontbreken", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .put("/api/meal/1")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property(
          "message",
          "Invalid input for one or more fields"
        );
        done();
      });
  });

  it("TC-302-2 Niet ingelogd", (done) => {
    const token = "";
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .put("/api/meal/1")
      .send(meal)
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property(
          "message",
          "Authorization header missing!"
        );
        done();
      });
  });

  it("TC-302-3 Niet de eigenaar van de data", (done) => {
    const token = jwt.sign({ userId: 2 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .put("/api/meal/1")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(403);
        res.body.should.have.property("message", "Not authorized");
        done();
      });
  });

  it("TC-302-4 Maaltijd bestaat niet", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .put("/api/meal/999")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property("message", "Meal not found");
        done();
      });
  });

  it("TC-302-5 Succesvolle wijziging", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    const meal = {
      isActive: 1,
      isVega: 0,
      isVegan: 0,
      isToTakeHome: 0,
      dateTime: "2023-05-20 18:30:00",
      maxAmountOfParticipants: 8,
      price: "15.99",
      imageUrl: "https://example.com/image1.jpg",
      cookId: 1,
      createDate: "2023-05-18",
      updateDate: "2023-05-18",
      name: "Meal 1",
      description: "This is the description for Meal 1",
      allergenes: "lactose",
    };

    chai
      .request(server)
      .put("/api/meal/1")
      .send(meal)
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("message", "Meal updated");
        const { meal } = res.body.data;
        meal.should.have.property("mealId", '1');
        meal.should.have.property("isActive", 1);
        meal.should.have.property("isVega", 0);
        meal.should.have.property("isVegan", 0);
        meal.should.have.property("isToTakeHome", 0);
        meal.should.have.property("maxAmountOfParticipants", 8);
        meal.should.have.property("price", '15.99');
        meal.should.have.property("imageUrl", 'https://example.com/image1.jpg');
        done();
      });
  });

  after((done) => {
    // Clear the database after testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-303 Opvragen van alle maaltijden", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      console.log("clear_db: " + err);
      assert(err === null);
      pool.query(INSERT, (err, result) => {
        console.log("insert_meal: " + err);
        assert(err === null);
        done();
      });
    });
  });

  it("TC-303-1 Succesvolle opvraging", (done) => {
    chai
      .request(server)
      .get("/api/meal")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("message", "Meals retrieved");
        res.body.should.have.property("data");
        res.body.data.should.have.property("meals");
        const { data } = res.body;
        data.meals.should.be.an("array");
        data.meals.length.should.be.eql(2);
        const meal = data.meals[0];
        meal.should.have.property("mealId", 1);
        meal.should.have.property("isActive", 1);
        meal.should.have.property("isVega", 1);
        meal.should.have.property("isVegan", 0);
        meal.should.have.property("isToTakeHome", 0);
        meal.should.have.property("maxAmountOfParticipants", 8);
        meal.should.have.property("price", '15.99');
        meal.should.have.property("imageUrl", 'https://example.com/image1.jpg');
        done();
      });
  });

  after((done) => {
    // Clear the database after testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-304 Opvragen van een maaltijd bij id", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      console.log("clear_db: " + err);
      assert(err === null);
      pool.query(INSERT, (err, result) => {
        console.log("insert_meal: " + err);
        assert(err === null);
        done();
      });
    });
  });

  it("TC-304-1 maaltijd bestaat niet", (done) => {
    chai
      .request(server)
      .get("/api/meal/999")
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property("message", "Meal not found");
        done();
      });
  });

  it("TC-304-2 succesvolle opvraging", (done) => {
    chai
      .request(server)
      .get("/api/meal/1")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("message", "Meal retrieved");
        res.body.should.have.property("data");
        res.body.data.should.be.a("array");
        res.body.data[0].should.have.property("id", 1);
        res.body.data[0].should.have.property("isActive", 1);
        res.body.data[0].should.have.property("isVega", 1);
        res.body.data[0].should.have.property("isVegan", 0);
        res.body.data[0].should.have.property("isToTakeHome", 0);
        res.body.data[0].should.have.property("maxAmountOfParticipants", 8);
        res.body.data[0].should.have.property("price", "15.99");
        res.body.data[0].should.have.property(
          "imageUrl",
          "https://example.com/image1.jpg"
        );
        res.body.data[0].should.have.property("cookId", 1);
        res.body.data[0].should.have.property("name", "Meal 1");
        res.body.data[0].should.have.property(
          "description",
          "This is the description for Meal 1"
        );
        res.body.data[0].should.have.property("allergenes", "lactose");
        done();
      });
  });

  after((done) => {
    // Clear the database after testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-305 verwijderen van maaltijd", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      console.log("clear_db: " + err);
      assert(err === null);
      pool.query(INSERT, (err, result) => {
        console.log("insert_meal: " + err);
        assert(err === null);
        done();
      });
    });
  });

  it("TC-305-1 niet ingelogd", (done) => {
    const token = "";
    chai
      .request(server)
      .delete("/api/meal/1")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property("message", "Invalid token!");
        done();
      });
  });

  it("TC-305-2 niet de eigenaar van de data", (done) => {
    const token = jwt.sign({ userId: 2 }, jwtSecretKey);
    chai
      .request(server)
      .delete("/api/meal/1")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(403);
        res.body.should.have.property(
          "message",
          "You are not the owner of this data!"
        );
        done();
      });
  });

  it("TC-305-3 maaltijd bestaat niet", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    chai
      .request(server)
      .delete("/api/meal/999")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property("message", "Meal not found");
        done();
      });
  });

  it("TC-305-4 maaltijd succesvol verwijderd", (done) => {
    const token = jwt.sign({ userId: 1 }, jwtSecretKey);
    chai
      .request(server)
      .delete("/api/meal/1")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("message", "Meal deleted");
        done();
      });
  });

  after((done) => {
    // Clear the database after testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});
