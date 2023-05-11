// NOG NIET AF
process.env["DB_DATABASE"] = process.env.DB_DATABASE || "shareameal-testdb";
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const assert = require("assert");
const dbconnection = require("../../src/util/database");
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

const INSERT_USER =
  "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES" +
  '(6, "John", "Doe", "john.doe@example.com", "secret", "street", "Amsterdam");';

// describe("UC-201 Registreren als nieuwe user", () => {
//   beforeEach((done) => {
//     dbconnection
//       .execute(CLEAR_DB)
//       .then(() => dbconnection.execute(INSERT_USER))
//       .then(() => done())
//       .catch((err) => {
//         logger.error(err);
//         done();
//       });
//   });

//   it("TC-201-1 - Verplicht veld ontbreekt", (done) => {
//     // Testen die te maken hebben met authenticatie of het valideren van
//     // verplichte velden kun je nog niet uitvoeren. Voor het eerste inlevermoment
//     // mag je die overslaan.
//     // In een volgende huiswerk opdracht ga je deze tests wel uitwerken.
//     // Voor nu:
//     done();
//   });

//   it("TC-201-5 - User succesvol geregistreerd", (done) => {
//     // nieuwe user waarmee we testen
//     const newUser = {
//       firstName: "Luuk",
//       lastName: "beks",
//       emailAdress: "asdua@mail.com",
//       password: "123",
//       street: "street",
//       city: "city",
//     };
//     // Voer de test uit
//     chai
//       .request(server)
//       .post("/api/user")
//       .send(newUser)
//       .end((err, res) => {
//         assert(err === null);
//         res.body.should.be.an("object");
//         let { data, message, status } = res.body;
//         status.should.equal(200);
//         message.should.be.a("string").that.contains("toegevoegd");
//         data.should.be.an("object");
//         // Controleren of de data van de nieuwe gebruiker correct is opgeslagen
//         data.should.include({ firstName: "Luuk" });
//         data.should.include({ lastName: "beks" });
//         data.should.include({ emailAdress: "asdua@mail.com" });
//         data.should.include({ password: "123" });
//         data.should.include({ street: "street" });
//         data.should.include({ city: "city" });
//         done();
//       });
//   });
// });

describe("getAllUsers", () => {
  before((done) => {
    // run any necessary setup before running the tests
    done();
  });

  it("should return a list of users with status code 200", (done) => {
    chai
      .request(server)
      .get("/api/user")
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(200);
        res.body.should.be.an("object");
        expect(res.body.message).to.equal("User getAll endpoint");
        res.body.data.should.be.an("array");
        res.body.data.length.should.be.greaterThan(0);
        done();
      });
  });

  it("should return a list of active users with status code 200", (done) => {
    chai
      .request(server)
      .get("/api/user?isactive=true")
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(200);
        res.body.should.be.an("object");
        expect(res.body.message).to.equal("User getAll endpoint");
        res.body.data.should.be.an("array");
        res.body.data.length.should.be.greaterThan(0);
        for (const user of res.body.data) {
          expect(user.isActive).to.be.true;
        }
        done();
      });
  });

  after((done) => {
    // run any necessary teardown after running the tests
    done();
  });
});

describe("UC-203 Opvragen van gebruikersprofiel (ingelogde gebruiker)", () => {
  it("should return the user profile of the logged in user", (done) => {
    // mock the request object to include the user id of the logged in user
    const req = {
      user: {
        id: 1,
      },
    };

    chai
      .request(server)
      .get("/api/user/profile")
      // .set('Authorization', 'Bearer ' + token) // set an authentication token if required
      .send(req)
      .end((err, res) => {
        assert(err === null);
        res.should.have.status(200);
        res.body.should.be.an("object");
        res.body.data.should.be.an("array").with.lengthOf(1);
        const user = res.body.data[0];
        user.should.have.property("id", 1);
        // check other properties of the user object if required
        done();
      });
  });
});

describe("UC-204 Opvragen van gebruikersprofiel bij id", () => {
  beforeEach((done) => {
    // Insert test user data into database
    dbconnection
      .execute(INSERT_USER)
      .then(() => done())
      .catch((err) => {
        logger.error(err);
        done();
      });
  });

  it("TC-204-1 - Get user profile by id", (done) => {
    // Define the user ID to retrieve
    const userID = 6;

    // Make a GET request to retrieve the user profile
    chai
      .request(server)
      .get(`/api/user/${userID}`)
      .end((err, res) => {
        // Check that there are no errors
        assert(err === null);

        // Check that the response is a JSON object with expected keys
        res.body.should.be.an("object");
        res.body.should.have.keys("statusCode", "message", "data");

        // Check that the status code is 200
        res.body.statusCode.should.equal(200);

        // Check that the response message is as expected
        res.body.message.should.equal("User getAll endpoint");

        // Check that the data field is an array with length 1
        res.body.data.should.be.an("array").with.lengthOf(1);

        // Check that the user data in the response matches the expected data
        const user = res.body.data[0];
        user.should.have.keys(
          "id",
          "firstname",
          "lastname",
          "emailAdress",
          "password",
          "phoneNumber",
          "city",
          "isActive",
          "street"
        );
        user.id.should.equal(userID);
        user.firstname.should.equal("John");
        user.emailAdress.should.equal("john.doe@example.com");
        user.city.should.equal("Amsterdam");
        user.isActive.should.equal(true);

        // Call done() to indicate that the test has completed
        done();
      });
  });
});

// describe("UC-205 Wijzigen van gebruikersprofiel", () => {});

describe("deleteUser", () => {
  it("should delete the user with the specified id", (done) => {
    const req = { params: { id: 1 } };
    const res = {
      status: function (statusCode) {
        expect(statusCode).toBe(200);
        return this;
      },
      json: function (result) {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("User deleted successfully");
        expect(result.data).toEqual({});
        done();
      },
    };
    const next = jest.fn();

    app.delete("api/user/:id", userController.deleteUser);

    request(app)
      .delete("api/user/1")
      .expect(200)
      .end((err, res) => {
        if (err) throw err;
      });
  });

  it("should return a 404 if the user with the specified id does not exist", (done) => {
    const req = { params: { id: 999 } };
    const res = {
      status: function (statusCode) {
        expect(statusCode).toBe(404);
        return this;
      },
      json: function (result) {
        expect(result.statusCode).toBe(404);
        expect(result.message).toBe("User not found");
        expect(result.data).toEqual({});
        done();
      },
    };
    const next = jest.fn();

    app.delete("api/user/:id", userController.deleteUser);

    request(app)
      .delete("api/user/999")
      .expect(404)
      .end((err, res) => {
        if (err) throw err;
      });
  });
});
