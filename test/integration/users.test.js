const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../index');

chai.should();
chai.use(chaiHttp);

describe('UC-201 Registreren als nieuwe user', () => {
  it('TC-201-1 - Verplicht veld ontbreekt', (done) => {
    // Testen die te maken hebben met authenticatie of het valideren van
    // verplichte velden kun je nog niet uitvoeren. Voor het eerste inlevermoment
    // mag je die overslaan.
    // In een volgende huiswerk opdracht ga je deze tests wel uitwerken.
    // Voor nu:
    done();
  });

  it('TC-201-5 - User succesvol geregistreerd', (done) => {
    // nieuwe user waarmee we testen
    const newUser = {
      firstName: "Luuk",
      lastName: "beks",
      emailAdress: "beks@mail.com",
      password: "123",
      phonenumber: "012398102",
      active: true
    };

    // Voer de test uit
    chai
      .request(server)
      .post('/api/user')
      .send(newUser)
      .end((err, res) => {
        assert(err === null);

        res.body.should.be.an('object');
        let { data, message, status } = res.body;
      
        status.should.equal(200);
        message.should.be.a('string').that.contains('toegevoegd');
        data.should.be.an('object');
      
        // Controleren of de data van de nieuwe gebruiker correct is opgeslagen
        data.should.include({ firstName: 'Luuk' });
        data.should.include({ lastName: 'beks' });
        data.should.include({ emailAdress: 'beks@mail.com' });
        data.should.include({ password: '123' });
        data.should.include({ phonenumber: '012398102' });
        data.should.include({ active: true });   
        done();
      });
  });
});

describe('UC-202-2 Opvragen van overzicht van users', () => {
  it('TC-202-1 - Toon alle gebruikers, minimaal 2', (done) => {
    // Voer de test uit
    chai
      .request(server)
      .get('/api/user')
      .end((err, res) => {
        assert(err === null);
        res.body.should.be.an('object');
        let { data, message, status } = res.body;
        status.should.equal(200);
        message.should.be.a('string').equal('User getAll endpoint');
        // Je kunt hier nog testen dat er werkelijk 2 userobjecten in het array zitten.
        // Maarrr: omdat we in een eerder test een user hebben toegevoegd, bevat
        // de database nu 3 users...
        // We komen hier nog op terug.
        data.should.be.an('array').that.has.length(3);
        done();
      });
  });

  // Je kunt een test ook tijdelijk skippen om je te focussen op andere testcases.
  // Dan gebruik je it.skip
  it.skip('TC-202-2 - Toon gebruikers met zoekterm op niet-bestaande velden', (done) => {
    // Voer de test uit
    chai
      .request(server)
      .get('/api/user')
      .query({ name: 'foo', city: 'non-existent' })
      // Is gelijk aan .get('/api/user?name=foo&city=non-existent')
      .end((err, res) => {
        assert(err === null);

        res.body.should.be.an('object');
        let { data, message, status } = res.body;

        status.should.equal(200);
        message.should.be.a('string').equal('User getAll endpoint');
        data.should.be.an('array');

        done();
      });
  });
});

// TC-203-2 Gebruiker is ingelogd met geldig token.
// (Niet testen op token; alleen een fictief profiel retourneren)
describe('UC-203-2 Opvragen van profiel van ingelogde user', () => {
  it('TC-203-2 - Toon profiel van ingelogde user', (done) => {
    // Voer de test uit
    chai
      .request(server)
      .get('/api/user/profile')
      .end((err, res) => {
        assert(err === null);

        res.body.should.be.an('object');
        let { data, message, status } = res.body;

        status.should.equal(200);
        message.should.be.a('string').equal('User profile endpoint');
        data.should.be.an('object');

        done();
      });
  });
});

// TC-204-3 Gebruiker-ID bestaat
// (De user met het gegeven id wordt geretourneerd)
describe('UC-204-3 Opvragen van profiel van user', () => {
  it('TC-204-3 - Toon profiel van user', (done) => {
    // Voer de test uit
    chai
      .request(server)
      .get('/api/user/1')
      .end((err, res) => {
        assert(err === null);

        res.body.should.be.an('object');
        let { data, message, status } = res.body;

        status.should.equal(200);
        message.should.be.a('string').equal('User getById endpoint');
        data.should.be.an('object');

        done();
      });
  });
});

// TC-206-4 Gebruiker succesvol verwijderd
// (Uitdaging: de user met het gegeven id is verwijderd uit de database.)
describe('UC-206-4 Verwijderen van user', () => {
  it('TC-206-4 - Verwijder user', (done) => {
    // Voer de test uit
    chai
      .request(server)
      .delete('/api/user/1')
      .end((err, res) => {
        assert(err === null);

        res.body.should.be.an('object');
        let { data, message, status } = res.body;

        status.should.equal(200);
        message.should.be.a('string').equal('User deleted');
        data.should.be.an('object');

        done();
      });
  });
});

