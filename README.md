gcloud spanner instances create cafe-db \
  --config=regional-asia-northeast1 \
  --description="cafe" \
  --nodes=1

gcloud spanner databases create cafe --instance=cafe-db

gcloud spanner databases ddl update cafe --instance=cafe-db --ddl="CREATE TABLE Menu (MenuId STRING(36) NOT NULL, Name STRING(255) NOT NULL, Description STRING(500), Price FLOAT64 NOT NULL, Available BOOL NOT NULL, CreatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)) PRIMARY KEY(MenuId);"

gcloud spanner databases ddl update cafe --instance=cafe-db --ddl="
CREATE TABLE Orders (
    OrderId STRING(36) NOT NULL,
    TableNumber INT64 NOT NULL,
    MenuItem STRING(255) NOT NULL,
    Quantity INT64 NOT NULL,
    Status STRING(50) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
  ) PRIMARY KEY(OrderId);"

  CREATE TABLE Menu (
    MenuId STRING(36) NOT NULL,
    Name STRING(255) NOT NULL,
    Description STRING(500),
    Price FLOAT64 NOT NULL,
    Available BOOL NOT NULL,
    CreatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
  ) PRIMARY KEY(MenuId);


gcloud spanner databases execute-sql cafe \
  --instance=cafe-db \
  --sql="INSERT INTO Menu (MenuId, Name, Description, Price, Available, CreatedAt) VALUES
  ('1', 'Cappuccino', 'A hot espresso-based coffee drink', 4.50, true, PENDING_COMMIT_TIMESTAMP()),
  ('2', 'Latte', 'A milky coffee made with espresso and steamed milk', 4.00, true, PENDING_COMMIT_TIMESTAMP()),
  ('3', 'Espresso', 'A small, strong black coffee', 3.00, true, PENDING_COMMIT_TIMESTAMP()),
  ('4', 'Croissant', 'A buttery, flaky pastry', 2.50, true, PENDING_COMMIT_TIMESTAMP()),
  ('5', 'Muffin', 'A sweet baked good', 3.00, true, PENDING_COMMIT_TIMESTAMP());"

gcloud spanner databases execute-sql cafe \
  --instance=cafe-db \
  --sql="SELECT * FROM Menu;"
# cafe-order
