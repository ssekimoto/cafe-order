const express = require('express');
const { Spanner } = require('@google-cloud/spanner');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS設定（全てのオリジンを許可）
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type'
}));

// Cloud Spanner セットアップ
const projectId = process.env.GCP_PROJECT_ID || 'taro-demo';
const instanceId = process.env.SPANNER_INSTANCE_ID || 'cafe-db';
const databaseId = process.env.SPANNER_DATABASE_ID || 'cafe';

const spanner = new Spanner({ projectId });
const instance = spanner.instance(instanceId);
const database = instance.database(databaseId);

// 注文作成
app.post('/orders', async (req, res) => {
  const { tableNumber, menuItem, quantity } = req.body;
  const orderId = uuidv4();
  const status = 'pending';

  // 入力データのバリデーション
  if (!tableNumber || !menuItem || !quantity) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    // トランザクションの実行
    await database.runTransactionAsync(async (transaction) => {
      const query = {
        sql: `INSERT INTO Orders (OrderId, TableNumber, MenuItem, Quantity, Status, CreatedAt) 
              VALUES (@orderId, @tableNumber, @menuItem, @quantity, @status, PENDING_COMMIT_TIMESTAMP())`,
        params: { orderId, tableNumber, menuItem, quantity, status },
      };

      // クエリ実行
      await transaction.runUpdate(query);
      await transaction.commit();
    });

    // 新規注文データを返す
    const newOrder = {
      orderId,
      tableNumber,
      menuItem,
      quantity,
      status,
      createdAt: new Date().toISOString(), // PENDING_COMMIT_TIMESTAMP() の値を取得する方法がないため、現在時刻を使用
    };

    res.status(201).json(newOrder);
  } catch (error) {
    // エラー発生時の詳細なログとレスポンス
    console.error('Error occurred during order creation:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// 注文一覧取得
app.get('/orders', async (req, res) => {
  try {
    const [rows] = await database.run({
      sql: `SELECT * FROM Orders ORDER BY CreatedAt DESC`,
    });

    // プロパティ名を小文字のキャメルケースに変換
    const data = rows.map(row => {
      const item = row.toJSON();
      return {
        orderId: item.OrderId,
        tableNumber: item.TableNumber,
        menuItem: item.MenuItem,
        quantity: item.Quantity,
        status: item.Status,
        createdAt: item.CreatedAt,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error occurred while fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// 注文ステータス更新
app.put('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    await database.runTransactionAsync(async (transaction) => {
      const query = {
        sql: `UPDATE Orders SET Status = @status WHERE OrderId = @id`,
        params: { id, status },
      };
      await transaction.runUpdate(query);
      await transaction.commit();
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error occurred while updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// 注文削除
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await database.runTransactionAsync(async (transaction) => {
      const query = {
        sql: `DELETE FROM Orders WHERE OrderId = @id`,
        params: { id },
      };
      await transaction.runUpdate(query);
      await transaction.commit();
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error occurred while deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Order API running on port ${PORT}`);
});
