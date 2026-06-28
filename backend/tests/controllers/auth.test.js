jest.mock('../../src/models/user');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User   = require('../../src/models/user');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { inscription, connexion } = require('../../src/controllers/auth');

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json:   jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('auth.controller — inscription', () => {

  test('refuse si email ou mot de passe manquant', async () => {
    const req = { body: { email: '', password: '' } };
    const res = mockRes();

    await inscription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email et mot de passe requis' });
  });

  test('refuse un email mal formé', async () => {
    const req = { body: { email: 'pasunemail', password: 'motdepasse' } };
    const res = mockRes();

    await inscription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Adresse email invalide' });
  });

  test('refuse un mot de passe trop court (< 6 caractères)', async () => {
    const req = { body: { email: 'test@test.com', password: '123' } };
    const res = mockRes();

    await inscription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Le mot de passe doit faire au moins 6 caractères',
    });
  });

  test("refuse si l'email est déjà utilisé", async () => {
    User.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const req = { body: { email: 'test@test.com', password: 'motdepasse' } };
    const res = mockRes();

    await inscription(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('crée le compte et retourne un token en cas de succès', async () => {
    User.findByEmail.mockResolvedValue(null);
    User.create.mockResolvedValue(42);
    bcrypt.hash.mockResolvedValue('hash_bidon');
    jwt.sign.mockReturnValue('token_bidon');

    const req = { body: { email: 'nouveau@test.com', password: 'motdepasse' } };
    const res = mockRes();

    await inscription(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('motdepasse', 10);
    expect(User.create).toHaveBeenCalledWith('nouveau@test.com', 'hash_bidon');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token_bidon' })
    );
  });
});

describe('auth.controller — connexion', () => {

  test('refuse si email ou mot de passe manquant', async () => {
    const req = { body: { email: '', password: '' } };
    const res = mockRes();

    await connexion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("refuse si l'utilisateur n'existe pas", async () => {
    User.findByEmail.mockResolvedValue(null);

    const req = { body: { email: 'inconnu@test.com', password: 'motdepasse' } };
    const res = mockRes();

    await connexion(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email ou mot de passe incorrect' });
  });

  test('refuse un mot de passe incorrect', async () => {
    User.findByEmail.mockResolvedValue({
      id: 1, email: 'test@test.com', password: 'hash_stocke', role: 'customer',
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: 'test@test.com', password: 'mauvais_mdp' } };
    const res = mockRes();

    await connexion(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('retourne un token en cas de succès', async () => {
    User.findByEmail.mockResolvedValue({
      id: 1, email: 'test@test.com', password: 'hash_stocke', role: 'customer',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token_bidon');

    const req = { body: { email: 'test@test.com', password: 'bon_mdp' } };
    const res = mockRes();

    await connexion(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token_bidon' })
    );
  });
});