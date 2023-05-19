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

const INSERT_USER = "INSERT INTO user (id, firstName, lastName, isActive, emailAdress, password, phoneNumber, roles, street, city) VALUES (6, 'john', 'doe', 1, 'johan.doe@example.com', 'Welkom123', '0612345678', 'admin', '28 straat', 'Eindhoven'), (7, 'jane', 'smith', 0, 'jane.smith@example.com', 'Password123', '0612345678', 'user', '42 avenue', 'New York')";

describe("UC 101 - inloggen", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-101-1 - Verplicht veld ontbreekt", (done) => {
    chai
      .request(server)
      .post("/api/login")
      .send({ emailAdress: "johan.doe@example.com" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        let { data } = res.body;
  
        res.should.have.status(400);
        body.should.be.an("object");
        body.should.have.property(
          "error",
          "AssertionError [ERR_ASSERTION]: password must be a string."
        );
        body.should.have.property("datetime");
  
        done();
      });
  });

  it("TC-101-2 - Verkeerd wachtwoord", (done) => {
    chai
      .request(server)
      .post("/api/login")
      .send({ emailAdress: "johan.doe@example.com", password: "Welkom12" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.be.an("object");
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have.property("message").to.be.equal("Not authorized");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        done();
      });
  });

  it("TC-101-3 - gebruiker bestaat niet", (done) => {
    chai
      .request(server)
      .post("/api/login")
      .send({ emailAdress: "j.doe@example.com", password: "Welkom123" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(404);
        body.should.be.an("object");
        body.should.have.property("statusCode").to.be.equal(404);
        body.should.have.property("message").to.be.equal("User not found");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        done();
      });
  });

  it("TC-101-4 - gebruiker succesvol ingelogd", (done) => {
    chai
      .request(server)
      .post("/api/login")
      .send({
        emailAdress: "johan.doe@example.com",
        password: "Welkom123",
      })
      .end((err, res) => {
        assert(err === null);
        res.should.have.status(200);
        res.body.should.be.an("object");
        res.body.should.have.property("code").to.be.equal(200);
        res.body.should.have.property("message").to.be.equal("Login endpoint");
        res.body.should.have.property("data");
        const { data } = res.body;
        data.should.be.an("object");
        data.should.have.property("token");
        data.should.have.property("id");
        data.should.have.property("firstName");
        data.should.have.property("lastName");
        data.should.have.property("emailAdress");
        data.should.have.property("phoneNumber");
        data.should.have.property("street");
        data.should.have.property("city");
        data.should.have.property("roles");
        data.should.have.property("isActive");
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

describe("UC-201 - Registreren als nieuwe user", () => {
  before((done) => {
    // Clear the database and insert a user for testing
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });

  it("TC-201-1 - Verplicht veld ontbreekt", (done) => {
    chai
      .request(server)
      .post("/api/user")
      .send({
        firstName: "john",
        lastName: "doe",
        emailAdress: "johan.doe@example.com",
        password: "wjjwjjW123",
        phoneNumber: "0612345678",
        roles: "admin",
        street: "straat",
        city: "stad",
      })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.be.an("object");
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("isActive must be an integer, 1 or 0"); // because isActive is missing. so if you remove firstName the error will be different
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        done();
      });
  });

  it("TC-201-2 - niet valide emailAdres", (done) => {
    chai
      .request(server)
      .post("/api/user")
      .send({
        firstName: "john",
        lastName: "doe",
        isActive: 1,
        emailAdress: "johan.doe@.com",
        password: "welkom1212",
        phoneNumber: "0612345678",
        roles: "admin",
        street: "straat",
        city: "stad",
      })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.be.an("object");
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("emailAdress is invalid");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        done();
      });
  });

  it("TC-201-3 - niet valide wachtwoord", (done) => {
    chai
      .request(server)
      .post("/api/user")
      .send({
        firstName: "john",
        lastName: "doe",
        isActive: 1,
        emailAdress: "johan.doe@example.com",
        password: 12,
        phoneNumber: "0612345678",
        roles: "admin",
        street: "straat",
        city: "stad",
      })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        body.should.be.an("object");
        res.should.have.status(400);
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("password must be a string");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        done();
      });
  });

  it("TC-201-5 - gebruiker succesvol geregistreerd", (done) => {
    chai
      .request(server)
      .post("/api/user")
      .send({
        firstName: "john",
        lastName: "doe",
        isActive: 1,
        emailAdress: "johny.doe@example.com",
        password: "Welkom123",
        phoneNumber: "0612345678",
        roles: "admin",
        street: "straat",
        city: "stad",
      })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        body.should.be.an("object");
        res.should.have.status(201);
        body.should.have.property("statusCode").to.be.equal(201);
        body.should.have
          .property("message")
          .to.be.equal("User successfully created");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object");
        data.should.have.property("firstName");
        data.should.have.property("lastName");
        data.should.have.property("emailAdress");
        data.should.have.property("phoneNumber");
        data.should.have.property("roles");
        data.should.have.property("street");
        data.should.have.property("city");
        data.should.have.property("isActive");      
        done();
      });
  });

  it("TC-201-4 Gebruiker bestaat al", (done) => {
    const existingUser = {
      firstName: "john",
      lastName: "doe",
      isActive: 1,
      emailAdress: "johny.doe@example.com",
      password: "Welkom123",
      phoneNumber: "0612345678",
      roles: "admin",
      street: "straat",
      city: "stad",
    };

    // Create the user with existingUser data
    chai
      .request(server)
      .post("/api/user")
      .send(existingUser)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(403);
        body.should.have.property("statusCode").to.be.equal(403);
        body.should.have.property("message").to.be.equal("User already exists");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
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

describe("uc-202 - krijg alle users", () => {
  before((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-202-1 Toon alle gebruikers (minimaal 2)", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User getAll endpoint");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("array").and.have.lengthOf.at.least(2);
        data.forEach((user) => {
          user.should.have.property("firstName");
          user.should.have.property("lastName");
          user.should.have.property("emailAdress");
          user.should.have.property("password");
          user.should.have.property("phoneNumber");
          user.should.have.property("roles");
          user.should.have.property("street");
          user.should.have.property("city");
          user.should.have.property("isActive");
        });
        done();
      });
  });

  it("TC-202-2 Toon gebruikers met zoekterm op niet-bestaande velden", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .query({ nonExistingField: "value" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("Invalid filter(s) used");
        done();
      });
  });

  it("TC-202-3 Toon gebruikers met gebruik van de zoekterm op het veld 'isActive'=false", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .query({ isActive: "false" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User getAll endpoint");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("array").and.have.lengthOf.at.least(1);
        assert(data[0].isActive === 0);
        data.forEach((user) => {
          user.should.have.property("firstName");
          user.should.have.property("lastName");
          user.should.have.property("emailAdress");
          user.should.have.property("password");
          user.should.have.property("phoneNumber");
          user.should.have.property("roles");
          user.should.have.property("street");
          user.should.have.property("city");
          user.should.have.property("isActive");
        });
        done();
      });
  });

  it("TC-202-4 Toon gebruikers met gebruik van de zoekterm op het veld 'isActive'=true", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .query({ isActive: "true" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User getAll endpoint");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("array").and.have.lengthOf.at.least(1);
        assert(data[0].isActive === 1);
        data.forEach((user) => {
          user.should.have.property("firstName");
          user.should.have.property("lastName");
          user.should.have.property("emailAdress");
          user.should.have.property("password");
          user.should.have.property("phoneNumber");
          user.should.have.property("roles");
          user.should.have.property("street");
          user.should.have.property("city");
          user.should.have.property("isActive");
        });
        done();
      });
  });

  it("TC-202-5 Toon gebruikers met zoektermen op bestaande velden (max op 2 velden filteren)", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .query({ isActive: "true", roles: "admin" })
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User getAll endpoint");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("array").and.have.lengthOf.at.least(1);
        assert(data[0].isActive === 1);
        assert(data[0].roles === "admin");
        data.forEach((user) => {
          user.should.have.property("firstName");
          user.should.have.property("lastName");
          user.should.have.property("emailAdress");
          user.should.have.property("password");
          user.should.have.property("phoneNumber");
          user.should.have.property("roles");
          user.should.have.property("street");
          user.should.have.property("city");
          user.should.have.property("isActive");
        });
        done();
      });
  });

  after((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-203 Opvragen van gebruikersprofiel (ingelogde gebruiker)", () => {
  before((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-203-1 Ongeldig token", (done) => {
    chai
      .request(server)
      .get("/api/user/profile")
      .set("Authorization", "Bearer invalidToken")
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(401);
        body.should.have.property("statusCode").to.be.equal(401);
        body.should.have.property("message").to.be.equal("Invalid token!");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-203-2 - Should return user profile met geldig token", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    chai
      .request(server)
      .get("/api/user/profile")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an("object");
        res.body.should.have.property("code").to.be.equal(200);
        res.body.should.have.property("message");
        res.body.should.have.property("data");
        let { data, message } = res.body;
        data.should.be.an("object");
        data.should.have.property("id");
        data.should.have.property("firstName");
        data.should.have.property("lastName");
        data.should.have.property("emailAdress");
        data.should.have.property("password");
        data.should.have.property("phoneNumber");
        data.should.have.property("roles");
        data.should.have.property("street");
        data.should.have.property("city");
        data.should.have.property("isActive");
        done();
      });
  });

  after((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-204 Opvragen van gebruikersprofiel bij id", () => {
  before((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-204-1 Ongeldig token", (done) => {
    chai
      .request(server)
      .get("/api/user/6")
      .set("Authorization", "Bearer FakeToken")
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(401);
        body.should.have.property("statusCode").to.be.equal(401);
        body.should.have.property("message").to.be.equal("Invalid token!");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-204-2 Gebruiker-ID bestaat niet", (done) => {
    const token = jwt.sign({ userId: 99999 }, jwtSecretKey);
    chai
      .request(server)
      .get("/api/user/99999")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(404);
        body.should.have.property("statusCode").to.be.equal(404);
        body.should.have.property("message").to.be.equal("User not found!");
        body.should.have.property("data");
        const { data } = body;
        assert.deepEqual(data, {});
        done();
      });
  });

  it("TC-204-3 Gebruiker-ID bestaat", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    chai
      .request(server)
      .get("/api/user/6")
      .set("Authorization", "Bearer " + token)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have.property("message").to.be.equal("User profile");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("array").with.lengthOf(1);
        const user = data[0];
        assert(user.isActive === 1);
        assert(user.roles === "admin");
        assert(user.id === 6);
        assert(user.firstName === "john");
        assert(user.lastName === "doe");
        done();
      });
  });

  after((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("UC-205 Wijzigen van gebruikersprofiel", () => {
  before((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-205-1 Verplicht veld 'emailAddress' ontbreekt", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    const userId = 6;
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      password: "password123",
      phoneNumber: "0612345678",
      street: "123 Main St",
      city: "New York",
      roles: "guest",
      isActive: 1,
    };
    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("email must be a string");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-205-2 De gebruiker is niet de eigenaar van de data", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    const userId = 7; // User ID 5 is not the owner of the data
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      isActive: 1,
      emailAdress: "johan.doe@example.com",
      password: "password123",
      phoneNumber: "0612345678",
      street: "123 Main St",
      city: "New York",
      roles: "guest",
    };

    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(403);
        body.should.have.property("statusCode").to.be.equal(403);
        body.should.have
          .property("message")
          .to.be.equal("Forbidden: You are not the owner of the data!");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-205-3 Niet-valide telefoonnummer", (done) => {
    const token = jwt.sign({ userId: 5 }, jwtSecretKey);
    const userId = 5; // User ID 5 is the owner of the data
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      isActive: 1,
      emailAdress: "johndoe@example.com",
      password: "password123",
      phoneNumber: "123", // Invalid phone number (less than 10 digits)
      street: "123 Main St",
      city: "New York",
      roles: "guest",
    };

    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(400);
        body.should.have.property("statusCode").to.be.equal(400);
        body.should.have
          .property("message")
          .to.be.equal("phonenumber must be a 10-digit number(06-12345678)");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-205-4 Gebruiker bestaat niet", (done) => {
    const token = jwt.sign({ userId: 5 }, jwtSecretKey);
    const userId = 123; // User ID 123 does not exist
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      isActive: 1,
      emailAdress: "jas@example.com",
      password: "password123",
      phoneNumber: "0612345678",
      street: "123 Main St",
      city: "New York",
      roles: "guest",
    };

    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(404);
        body.should.have.property("statusCode").to.be.equal(404);
        body.should.have.property("message").to.be.equal("User not found");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-205-5 Niet ingelogd", (done) => {
    const token = "";
    const userId = 123;
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      isActive: 1,
      emailAddress: "john@mail.com",
      password: "password123",
      phoneNumber: "0612345678",
      street: "123 Main St",
      city: "New York",
      roles: "guest",
    };

    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(401);
        body.should.have.property("statusCode").to.be.equal(401);
        body.should.have.property("message").to.be.equal("Invalid token!");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-205-6 Gebruiker succesvol gewijzigd", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    const userId = 6; // User ID 5 is the owner of the data
    const requestBody = {
      firstName: "John",
      lastName: "Doe",
      isActive: 1,
      emailAdress: "johan.doe@example.com",
      password: "password123",
      phoneNumber: "0612345678",
      street: "123 Main St",
      city: "New York",
      roles: "guest",
    };

    chai
      .request(server)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(requestBody)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User profile updated");
        body.should.have.property("data");
        const { data } = body;
        data.should.have.property("firstName").to.be.equal("John");
        data.should.have.property("lastName").to.be.equal("Doe");
        data.should.have.property("isActive").to.be.equal(1);
        data.should.have.property("emailAdress").to.be.equal("johan.doe@example.com");
        data.should.have.property("phoneNumber").to.be.equal("0612345678");
        data.should.have.property("street").to.be.equal("123 Main St");
        data.should.have.property("city").to.be.equal("New York");
        data.should.have.property("roles").to.be.equal("guest");
        done();
      });
  });

  after((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});

describe("deleteUser", () => {
  before((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      pool.query(INSERT_USER, (err, result) => {
        assert(err === null);
        done();
      });
    });
  });

  it("TC-206-1 Gebruiker bestaat niet", (done) => {
    const token = jwt.sign({ userId: 5 }, jwtSecretKey);
    const userId = 123; // User ID 123 does not exist

    chai
      .request(server)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(404);
        body.should.have.property("statusCode").to.be.equal(404);
        body.should.have.property("message").to.be.equal("User not found");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-206-2 Gebruiker is niet ingelogd", (done) => {
    const token = "";
    const userId = 7;

    chai
      .request(server)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(401);
        body.should.have.property("statusCode").to.be.equal(401);
        body.should.have.property("message").to.be.equal("Invalid token!");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-206-3 De gebruiker is niet de eigenaar van de data", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    const userId = 7; // Assuming user ID 1 exists

    chai
      .request(server)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(403);
        body.should.have.property("statusCode").to.be.equal(403);
        body.should.have
          .property("message")
          .to.be.equal("Forbidden: You are not authorized to delete this user");
        body.should.have.property("data");
        const { data } = body;
        data.should.be.an("object").and.to.be.empty;
        done();
      });
  });

  it("TC-206-4 Gebruiker succesvol verwijderd", (done) => {
    const token = jwt.sign({ userId: 6 }, jwtSecretKey);
    const userId = 6; // Assuming user ID 1 exists

    chai
      .request(server)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .end((err, res) => {
        assert(err === null);
        const { body } = res;
        res.should.have.status(200);
        body.should.have.property("statusCode").to.be.equal(200);
        body.should.have
          .property("message")
          .to.be.equal("User deleted with id " + userId);
        body.should.have.property("data");
        const { data } = body;
        done();
      });
  });

  after((done) => {
    pool.query(CLEAR_DB, (err, result) => {
      assert(err === null);
      done();
    });
  });
});
