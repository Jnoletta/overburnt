// On simule entièrement le pool de connexion : aucune vraie base de données
// n'est jamais sollicitée. On vérifie uniquement le comportement de la
// transaction (commit en cas de succès, rollback en cas de stock insuffisant).
jest.mock('../../src/config/db', () => ({
  getConnection: jest.fn(),
  query: jest.fn(),
}));

const pool  = require('../../src/config/db');
const Order = require('../../src/models/order');

describe('Order.create transaction et décrémentation du stock', () => {
  let mockConn;

  beforeEach(() => {
    mockConn = {
      beginTransaction: jest.fn(),
      query:            jest.fn(),
      commit:           jest.fn(),
      rollback:         jest.fn(),
      release:          jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConn);
  });

  test('commit la transaction quand le stock est suffisant', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 42 }])     // INSERT INTO orders
      .mockResolvedValueOnce([{}])                    // INSERT INTO order_products
      .mockResolvedValueOnce([{ affectedRows: 1 }]);  // UPDATE products (stock OK)

    const items = [{ product_id: 1, quantity: 2, unit_price: 10, taux_tva: 20 }];

    const orderId = await Order.create(7, items, '20.00', '1 rue Test, Paris');

    expect(orderId).toBe(42);
    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('annule la transaction (rollback) si le stock est insuffisant', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 42 }])     // INSERT INTO orders
      .mockResolvedValueOnce([{}])                    // INSERT INTO order_products
      .mockResolvedValueOnce([{ affectedRows: 0 }]);  // UPDATE products : stock insuffisant

    const items = [{ product_id: 1, quantity: 99, unit_price: 10, taux_tva: 20 }];

    await expect(Order.create(7, items, '990.00', null))
      .rejects.toThrow('Stock insuffisant');

    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('décrémente le stock avec la bonne quantité pour chaque produit', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const items = [{ product_id: 5, quantity: 3, unit_price: 15, taux_tva: 20 }];

    await Order.create(1, items, '45.00', null);

    // Le 3e appel à conn.query est l'UPDATE de décrémentation du stock
    const stockUpdateCall = mockConn.query.mock.calls[2];
    expect(stockUpdateCall[1]).toEqual([3, 5, 3]); // [quantity, product_id, quantity]
  });

  test('libère toujours la connexion (release), même en cas d\'échec', async () => {
    mockConn.query.mockRejectedValueOnce(new Error('Erreur SQL imprévue'));

    const items = [{ product_id: 1, quantity: 1, unit_price: 10, taux_tva: 20 }];

    await expect(Order.create(1, items, '10.00', null)).rejects.toThrow();

    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });
});