# SQL Commands Reference for Metabase

This document provides a comprehensive reference for SQL commands commonly used in Metabase, a popular open-source business intelligence tool.

## Table of Contents

1. [Basic SQL Syntax](#basic-sql-syntax)
2. [SELECT Statements](#select-statements)
3. [Filtering Data](#filtering-data)
4. [Sorting and Grouping](#sorting-and-grouping)
5. [Joins](#joins)
6. [Aggregation Functions](#aggregation-functions)
7. [Subqueries](#subqueries)
8. [Common Table Expressions (CTEs)](#common-table-expressions)
9. [Window Functions](#window-functions)
10. [Date and Time Functions](#date-and-time-functions)
11. [String Functions](#string-functions)
12. [Case Statements](#case-statements)
13. [Metabase-Specific Features](#metabase-specific-features)
14. [Performance Optimization](#performance-optimization)

---

## Basic SQL Syntax

SQL (Structured Query Language) is a standard language for interacting with relational databases. Here are the basics:

```sql
-- This is a comment
SELECT column1, column2 FROM table_name;
```

### SQL Statement Types

- **DDL (Data Definition Language)**: CREATE, ALTER, DROP, TRUNCATE
- **DML (Data Manipulation Language)**: SELECT, INSERT, UPDATE, DELETE
- **DCL (Data Control Language)**: GRANT, REVOKE
- **TCL (Transaction Control Language)**: COMMIT, ROLLBACK, SAVEPOINT

---

## SELECT Statements

The `SELECT` statement is used to query data from a database.

### Basic SELECT

```sql
SELECT * FROM customers;
```

### Select Specific Columns

```sql
SELECT first_name, last_name, email FROM customers;
```

### Using Aliases

```sql
SELECT
  first_name AS "First Name",
  last_name AS "Last Name"
FROM customers;
```

### DISTINCT Values

```sql
SELECT DISTINCT country FROM customers;
```

---

## Filtering Data

### WHERE Clause

```sql
SELECT * FROM products WHERE price > 100;
```

### Multiple Conditions

```sql
SELECT * FROM products
WHERE price > 100 AND category = 'Electronics';
```

### IN Operator

```sql
SELECT * FROM products
WHERE category IN ('Electronics', 'Computers', 'Accessories');
```

### LIKE Operator

```sql
-- Find all products that start with 'Apple'
SELECT * FROM products WHERE product_name LIKE 'Apple%';

-- Find all products that contain 'phone'
SELECT * FROM products WHERE product_name LIKE '%phone%';
```

### NULL Values

```sql
-- Find customers without an email
SELECT * FROM customers WHERE email IS NULL;

-- Find customers with an email
SELECT * FROM customers WHERE email IS NOT NULL;
```

---

## Sorting and Grouping

### ORDER BY

```sql
-- Sort by price ascending (default)
SELECT * FROM products ORDER BY price;

-- Sort by price descending
SELECT * FROM products ORDER BY price DESC;

-- Sort by multiple columns
SELECT * FROM products ORDER BY category, price DESC;
```

### GROUP BY

```sql
-- Count products by category
SELECT category, COUNT(*) as product_count
FROM products
GROUP BY category;

-- Get average price by category
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category;
```

### HAVING

```sql
-- Find categories with more than 10 products
SELECT category, COUNT(*) as product_count
FROM products
GROUP BY category
HAVING COUNT(*) > 10;
```

---

## Joins

### INNER JOIN

```sql
SELECT o.order_id, c.customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;
```

### LEFT JOIN

```sql
SELECT c.customer_name, o.order_id
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
```

### RIGHT JOIN

```sql
SELECT c.customer_name, o.order_id
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;
```

### FULL OUTER JOIN

```sql
SELECT c.customer_name, o.order_id
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;
```

### Self Join

```sql
-- Find employees and their managers
SELECT e.name as employee, m.name as manager
FROM employees e
INNER JOIN employees m ON e.manager_id = m.employee_id;
```

---

## Aggregation Functions

### COUNT

```sql
-- Count all rows
SELECT COUNT(*) FROM customers;

-- Count non-null values in a column
SELECT COUNT(email) FROM customers;
```

### SUM

```sql
-- Calculate total revenue
SELECT SUM(amount) as total_revenue FROM orders;
```

### AVG

```sql
-- Calculate average order value
SELECT AVG(amount) as avg_order_value FROM orders;
```

### MIN and MAX

```sql
-- Find the price range of products
SELECT
  MIN(price) as cheapest_product,
  MAX(price) as most_expensive_product
FROM products;
```

### Combining Aggregates

```sql
-- Get order statistics
SELECT
  COUNT(*) as order_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  MIN(amount) as smallest_order,
  MAX(amount) as largest_order
FROM orders;
```

---

## Subqueries

### IN Subquery

```sql
-- Find all products in categories with more than 10 products
SELECT * FROM products
WHERE category IN (
  SELECT category
  FROM products
  GROUP BY category
  HAVING COUNT(*) > 10
);
```

### Scalar Subquery

```sql
-- Find products priced higher than average
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### Correlated Subquery

```sql
-- Find customers who have placed more than 5 orders
SELECT * FROM customers c
WHERE 5 < (
  SELECT COUNT(*) FROM orders o
  WHERE o.customer_id = c.customer_id
);
```

---

## Common Table Expressions (CTEs)

CTEs provide a way to write more readable queries by breaking them down into simpler, named parts.

```sql
-- Find high-value customers
WITH customer_orders AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM orders
  GROUP BY customer_id
)
SELECT
  c.customer_name,
  co.order_count,
  co.total_spent
FROM customer_orders co
JOIN customers c ON co.customer_id = c.customer_id
WHERE co.total_spent > 1000
ORDER BY co.total_spent DESC;
```

### Multiple CTEs

```sql
WITH
  monthly_sales AS (
    SELECT
      DATE_TRUNC('month', order_date) as month,
      SUM(amount) as revenue
    FROM orders
    GROUP BY DATE_TRUNC('month', order_date)
  ),
  avg_monthly AS (
    SELECT AVG(revenue) as avg_monthly_revenue
    FROM monthly_sales
  )
SELECT
  month,
  revenue,
  revenue - avg_monthly_revenue as diff_from_avg
FROM monthly_sales, avg_monthly
ORDER BY month;
```

---

## Window Functions

Window functions perform calculations across a set of rows related to the current row.

### ROW_NUMBER

```sql
-- Assign a unique row number to each order by customer
SELECT
  customer_id,
  order_id,
  order_date,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_sequence
FROM orders;
```

### RANK and DENSE_RANK

```sql
-- Rank products by price within categories
SELECT
  category,
  product_name,
  price,
  RANK() OVER (PARTITION BY category ORDER BY price DESC) as price_rank,
  DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC) as price_dense_rank
FROM products;
```

### Running Totals

```sql
-- Calculate running total of order amounts by customer
SELECT
  customer_id,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) as running_total
FROM orders;
```

### Moving Averages

```sql
-- Calculate 3-month moving average of sales
SELECT
  order_month,
  monthly_sales,
  AVG(monthly_sales) OVER (ORDER BY order_month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as moving_avg_3m
FROM (
  SELECT
    DATE_TRUNC('month', order_date) as order_month,
    SUM(amount) as monthly_sales
  FROM orders
  GROUP BY DATE_TRUNC('month', order_date)
) monthly;
```

---

## Date and Time Functions

### Date Parts

```sql
-- Extract parts of a date
SELECT
  order_date,
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(MONTH FROM order_date) as month,
  EXTRACT(DAY FROM order_date) as day,
  EXTRACT(DOW FROM order_date) as day_of_week
FROM orders;
```

### Date Truncation

```sql
-- Group dates by different periods
SELECT
  DATE_TRUNC('year', order_date) as year,
  SUM(amount) as annual_sales
FROM orders
GROUP BY DATE_TRUNC('year', order_date);

SELECT
  DATE_TRUNC('month', order_date) as month,
  SUM(amount) as monthly_sales
FROM orders
GROUP BY DATE_TRUNC('month', order_date);
```

### Date Arithmetic

```sql
-- Find orders in the last 30 days
SELECT * FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

-- Calculate days between order and shipping
SELECT
  order_id,
  order_date,
  ship_date,
  ship_date - order_date as days_to_ship
FROM orders;
```

---

## String Functions

### String Concatenation

```sql
-- Concatenate first and last name
SELECT
  first_name,
  last_name,
  first_name || ' ' || last_name as full_name
FROM customers;
```

### Substring

```sql
-- Extract part of a string
SELECT
  email,
  SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) as username
FROM customers;
```

### Upper and Lower Case

```sql
-- Convert to upper or lower case
SELECT
  product_name,
  UPPER(product_name) as upper_name,
  LOWER(product_name) as lower_name
FROM products;
```

### Replace

```sql
-- Replace text within a string
SELECT
  product_name,
  REPLACE(product_name, 'Apple', 'Pear') as replaced_name
FROM products;
```

---

## Case Statements

### Simple CASE

```sql
-- Categorize prices
SELECT
  product_name,
  price,
  CASE
    WHEN price < 10 THEN 'Budget'
    WHEN price < 50 THEN 'Mid-range'
    WHEN price < 100 THEN 'Premium'
    ELSE 'Luxury'
  END as price_category
FROM products;
```

### CASE with aggregation

```sql
-- Count products in each price category
SELECT
  CASE
    WHEN price < 10 THEN 'Budget'
    WHEN price < 50 THEN 'Mid-range'
    WHEN price < 100 THEN 'Premium'
    ELSE 'Luxury'
  END as price_category,
  COUNT(*) as product_count
FROM products
GROUP BY
  CASE
    WHEN price < 10 THEN 'Budget'
    WHEN price < 50 THEN 'Mid-range'
    WHEN price < 100 THEN 'Premium'
    ELSE 'Luxury'
  END;
```

---

## Metabase-Specific Features

### Parameters in Metabase

Metabase allows you to create SQL queries with parameters that users can change:

```sql
-- Using field filter
SELECT * FROM orders
WHERE customer_id = {{customer_id}}

-- Using text filter
SELECT * FROM products
WHERE category = {{category}}

-- Using date filter
SELECT * FROM orders
WHERE order_date BETWEEN {{start_date}} AND {{end_date}}
```

### Metabase Variables

```sql
-- With a date variable
SELECT * FROM orders
WHERE order_date > {{date}}

-- With a number variable
SELECT * FROM products
WHERE price < {{price}}

-- With a text variable
SELECT * FROM customers
WHERE country = {{country}}
```

### Metabase Segments and Metrics

Metabase allows you to define reusable segments and metrics:

```sql
-- Using a segment (active users)
SELECT count(*) FROM {{#segment: active users}}

-- Using a metric (average order value)
SELECT {{metric: average order value}} FROM orders
```

### Metabase Custom SQL Questions

You can write custom SQL in Metabase to create more complex questions:

```sql
-- Complex question with filters
SELECT
  p.category,
  DATE_TRUNC('month', o.order_date) as month,
  SUM(oi.quantity * p.price) as revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE
  o.order_date BETWEEN {{start_date}} AND {{end_date}}
  AND p.category IN ({{categories}})
GROUP BY p.category, DATE_TRUNC('month', o.order_date)
ORDER BY p.category, month;
```

---

## Performance Optimization

### EXPLAIN

Use `EXPLAIN` to see how the database will execute your query:

```sql
EXPLAIN SELECT * FROM customers WHERE email LIKE '%gmail.com';
```

### EXPLAIN ANALYZE

Use `EXPLAIN ANALYZE` to see execution details with timing:

```sql
EXPLAIN ANALYZE SELECT * FROM orders
JOIN customers ON orders.customer_id = customers.customer_id
WHERE orders.amount > 1000;
```

### Indexing

Indexes speed up queries but slow down writes:

```sql
-- Create an index
CREATE INDEX idx_customer_email ON customers(email);

-- Create a composite index
CREATE INDEX idx_order_customer_date ON orders(customer_id, order_date);
```

### Limiting Results

```sql
-- Only get the top 10 results
SELECT * FROM products ORDER BY price DESC LIMIT 10;

-- Get the 11th through 20th results (pagination)
SELECT * FROM products ORDER BY price DESC LIMIT 10 OFFSET 10;
```

---

## Additional Resources

- [Metabase Documentation](https://www.metabase.com/docs/latest/)
- [SQL Tutorial](https://www.w3schools.com/sql/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

_Last updated: May 20, 2025_
