jest.mock('../../src/models/product');

const Product = require('../../src/models/product');
const { create, update } = require('../../src/controllers/product');

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json:   jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('product.controller — create', () => {

  test('refuse si le nom, le prix ou le stock sont manquants', async () => {
    const req = { body: { name: 'Mug Overburnt' } }; // price/stock absents
    const res = mockRes();

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Nom, prix et stock requis' });
    expect(Product.create).not.toHaveBeenCalled();
  });

  test('refuse un prix nul ou négatif', async () => {
    const req = { body: { name: 'Mug Overburnt', price: 0, stock: 10 } };
    const res = mockRes();

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Le prix doit être supérieur à 0' });
    expect(Product.create).not.toHaveBeenCalled();
  });

  test('refuse un stock négatif', async () => {
    const req = { body: { name: 'Mug Overburnt', price: 19.99, stock: -5 } };
    const res = mockRes();

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Le stock ne peut pas être négatif' });
    expect(Product.create).not.toHaveBeenCalled();
  });

  test('accepte un stock à 0 (rupture de stock volontaire, pas une erreur)', async () => {
    Product.create.mockResolvedValue(1);
    Product.findById.mockResolvedValue({ id: 1, name: 'Mug Overburnt', price: 19.99, stock: 0 });

    const req = { body: { name: 'Mug Overburnt', price: 19.99, stock: 0 } };
    const res = mockRes();

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('crée le produit quand les données sont valides', async () => {
    Product.create.mockResolvedValue(5);
    Product.findById.mockResolvedValue({
      id: 5, name: 'Mug Overburnt', price: 19.99, stock: 50,
    });

    const req = { body: { name: 'Mug Overburnt', price: 19.99, stock: 50 } };
    const res = mockRes();

    await create(req, res);

    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mug Overburnt', price: 19.99, stock: 50 })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Produit créé' })
    );
  });
});

describe('product.controller — update', () => {

  test('refuse une mise à jour avec un prix négatif', async () => {
    const req = {
      params: { id: 1 },
      body:   { name: 'Mug Overburnt', price: -10, stock: 20 },
    };
    const res = mockRes();

    await update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Product.update).not.toHaveBeenCalled();
  });

  test('retourne 404 si le produit à modifier n\'existe pas', async () => {
    Product.update.mockResolvedValue(0); // 0 ligne affectée = produit introuvable

    const req = {
      params: { id: 999 },
      body:   { name: 'Mug Overburnt', price: 19.99, stock: 20 },
    };
    const res = mockRes();

    await update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});