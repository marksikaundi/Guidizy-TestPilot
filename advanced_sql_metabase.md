# Advanced SQL Guide for Metabase

This guide provides in-depth explanations and practical examples for using SQL with Metabase, expanding on the command reference in `sql_commands.md`.

## Table of Contents

1. [Metabase SQL Architecture](#metabase-sql-architecture)
2. [Writing Effective SQL in Metabase](#writing-effective-sql-in-metabase)
3. [Advanced Filtering Techniques](#advanced-filtering-techniques)
4. [Dynamic Dashboards with Variables](#dynamic-dashboards-with-variables)
5. [Analytical SQL Patterns](#analytical-sql-patterns)
6. [Database-Specific SQL in Metabase](#database-specific-sql-in-metabase)
7. [SQL Optimization for Metabase](#sql-optimization-for-metabase)
8. [Troubleshooting SQL Issues](#troubleshooting-sql-issues)

---

## Metabase SQL Architecture

### How Metabase Executes SQL

Metabase acts as an intermediate layer between users and databases. When you write SQL in Metabase:

1. Metabase processes any variables or parameters
2. The query is sent to the connected database engine
3. Results are returned to Metabase for visualization
4. Metabase applies any post-processing (e.g., chart settings)

### Native Queries vs. GUI Questions

**Native Queries (SQL):**

- Offer full control over query logic
- Support advanced features not available in the GUI
- Require SQL knowledge
- Don't generate MBQL (Metabase Query Language) internally

**GUI Questions:**

- User-friendly interface for building queries
- Generate MBQL internally
- Limited to features supported by the interface
- Convert to SQL when sent to the database

```
┌───────────┐    ┌───────────┐    ┌───────────┐
│   GUI     │ -> │   MBQL    │ -> │    SQL    │
│ Questions │    │(internal) │    │ (to DB)   │
└───────────┘    └───────────┘    └───────────┘
      vs.
┌───────────┐    ┌───────────┐
│  Native   │ -> │    SQL    │
│  Queries  │    │ (to DB)   │
└───────────┘    └───────────┘
```

---

## Writing Effective SQL in Metabase

### Native Query Editor Features

Metabase's SQL editor provides several helpful features:

- **Syntax highlighting**: SQL keywords are highlighted for readability
- **Auto-completion**: Press Tab to get suggestions for tables and fields
- **Snippets**: Save and reuse common SQL fragments
- **Variables**: Use {{variable}} syntax for parameterized queries
- **Field references**: Use {{#field: id}} to reference fields by their Metabase ID

Example of creating and using a snippet:

```sql
-- Create a snippet for common date filtering logic
-- In the Snippet sidebar:
-- Name: recent_orders_filter
-- Content: o.order_date >= CURRENT_DATE - INTERVAL '30 days'

-- Using the snippet in a query:
SELECT
  o.order_id,
  o.customer_id,
  o.order_date,
  o.amount
FROM orders o
WHERE {{snippet: recent_orders_filter}}
ORDER BY o.order_date DESC;
```

### SQL Templates with Variables

Create reusable SQL templates with variables that can be changed by users:

```sql
-- Template for sales analysis by category and date range
SELECT
  p.category,
  COUNT(o.order_id) as num_orders,
  SUM(o.amount) as total_sales,
  AVG(o.amount) as avg_order_value
FROM orders o
JOIN products p ON o.product_id = p.product_id
WHERE
  o.order_date BETWEEN {{start_date}} AND {{end_date}}
  AND p.category = {{category}}
GROUP BY p.category
ORDER BY total_sales DESC;
```

When users run this query, they'll be prompted to enter values for `start_date`, `end_date`, and `category`.

---

## Advanced Filtering Techniques

### Complex WHERE Clauses

Combine multiple conditions for sophisticated filtering:

```sql
-- Find high-value customers who recently purchased specific products
SELECT
  c.customer_id,
  c.customer_name,
  COUNT(o.order_id) as order_count,
  SUM(o.amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE
  o.order_date >= CURRENT_DATE - INTERVAL '90 days'
  AND p.category IN ('Electronics', 'Computers')
  AND o.amount > 500
  AND c.customer_type = 'Retail'
GROUP BY c.customer_id, c.customer_name
HAVING COUNT(o.order_id) >= 3
ORDER BY total_spent DESC;
```

### Pattern Matching with LIKE and Regular Expressions

```sql
-- Basic LIKE patterns
SELECT * FROM products
WHERE product_name LIKE 'App%';        -- Starts with "App"
WHERE product_name LIKE '%Phone%';     -- Contains "Phone"
WHERE product_name LIKE '_-inch%';     -- Second character is "-inch"

-- PostgreSQL ILIKE for case-insensitive matching
SELECT * FROM products
WHERE product_name ILIKE '%phone%';    -- Case-insensitive match

-- PostgreSQL Regular expressions
SELECT * FROM customers
WHERE email ~ '^[A-Za-z0-9._%+-]+@gmail\.com$';  -- Gmail addresses with regex
```

### Using CASE for Conditional Filtering

```sql
-- Filter based on conditional logic
SELECT
  product_id,
  product_name,
  price,
  category,
  CASE
    WHEN price < 20 THEN 'Budget'
    WHEN price BETWEEN 20 AND 50 THEN 'Mid-range'
    WHEN price > 50 THEN 'Premium'
  END as price_tier
FROM products
WHERE
  CASE
    WHEN category = 'Electronics' THEN price > 100  -- Electronics must be > $100
    WHEN category = 'Clothing' THEN size IN ('M', 'L')  -- Only M or L clothing
    WHEN category = 'Books' THEN published_date >= '2020-01-01'  -- Recent books
    ELSE TRUE  -- Include all other categories
  END;
```

---

## Dynamic Dashboards with Variables

### Field Filters

Field filters map to columns in your database tables:

```sql
-- Query with a field filter
SELECT * FROM orders
WHERE customer_id = {{customer_id}};
```

When creating the variable, set:

- **Variable Type**: Field Filter
- **Field to Map To**: Customer ID

### Text, Number, and Date Variables

Create variables of different types:

```sql
-- Query with multiple variable types
SELECT
  p.product_id,
  p.product_name,
  p.price,
  SUM(oi.quantity) as units_sold
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE
  p.price <= {{max_price}}  -- Number variable
  AND p.category = {{category}}  -- Text variable
  AND o.order_date BETWEEN {{start_date}} AND {{end_date}}  -- Date variables
GROUP BY p.product_id, p.product_name, p.price
ORDER BY units_sold DESC;
```

### Dashboard Filters

Link variables across multiple questions in a dashboard:

```sql
-- Query 1: Sales by category (will be filtered by date range from dashboard)
SELECT
  p.category,
  SUM(o.amount) as revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date BETWEEN {{date_range_start}} AND {{date_range_end}}
GROUP BY p.category
ORDER BY revenue DESC;

-- Query 2: Top customers (will be filtered by same date range)
SELECT
  c.customer_name,
  COUNT(o.order_id) as order_count,
  SUM(o.amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date BETWEEN {{date_range_start}} AND {{date_range_end}}
GROUP BY c.customer_name
ORDER BY total_spent DESC
LIMIT 10;
```

When these questions are added to a dashboard, you can link both `date_range_start` and `date_range_end` variables to a single dashboard filter.

---

## Analytical SQL Patterns

### Cohort Analysis

Track user retention by cohort:

```sql
-- Cohort analysis by registration month
WITH
  user_cohorts AS (
    SELECT
      user_id,
      DATE_TRUNC('month', registration_date) as cohort_month
    FROM users
  ),
  user_activities AS (
    SELECT
      a.user_id,
      DATE_TRUNC('month', a.activity_date) as activity_month,
      uc.cohort_month,
      DATE_PART('month', DATE_TRUNC('month', a.activity_date) - uc.cohort_month) as months_since_cohort
    FROM activities a
    JOIN user_cohorts uc ON a.user_id = uc.user_id
    WHERE a.activity_date >= '2023-01-01'
  )
SELECT
  cohort_month,
  months_since_cohort,
  COUNT(DISTINCT user_id) as active_users
FROM user_activities
GROUP BY cohort_month, months_since_cohort
ORDER BY cohort_month, months_since_cohort;
```

### Customer Lifetime Value (CLV)

Calculate the average CLV by customer segment:

```sql
-- Calculate Customer Lifetime Value (CLV) by segment
WITH
  customer_revenue AS (
    SELECT
      c.customer_id,
      c.segment,
      SUM(o.amount) as total_revenue,
      MIN(o.order_date) as first_purchase,
      MAX(o.order_date) as last_purchase,
      COUNT(o.order_id) as num_purchases
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.segment
  )
SELECT
  segment,
  COUNT(customer_id) as num_customers,
  AVG(total_revenue) as avg_lifetime_value,
  AVG(num_purchases) as avg_num_purchases,
  AVG(DATE_PART('day', last_purchase - first_purchase)) as avg_customer_lifespan_days
FROM customer_revenue
GROUP BY segment
ORDER BY avg_lifetime_value DESC;
```

### Funnel Analysis

Track conversion rates through a purchase funnel:

```sql
-- E-commerce funnel analysis
WITH
  funnel_stages AS (
    SELECT
      user_id,
      SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as viewed,
      SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as added_to_cart,
      SUM(CASE WHEN event_type = 'checkout_start' THEN 1 ELSE 0 END) as started_checkout,
      SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchased
    FROM user_events
    WHERE event_date BETWEEN {{start_date}} AND {{end_date}}
    GROUP BY user_id
  )
SELECT
  COUNT(user_id) as total_users,
  SUM(CASE WHEN viewed > 0 THEN 1 ELSE 0 END) as users_viewed,
  SUM(CASE WHEN added_to_cart > 0 THEN 1 ELSE 0 END) as users_added_to_cart,
  SUM(CASE WHEN started_checkout > 0 THEN 1 ELSE 0 END) as users_started_checkout,
  SUM(CASE WHEN purchased > 0 THEN 1 ELSE 0 END) as users_purchased,
  ROUND(100.0 * SUM(CASE WHEN added_to_cart > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN viewed > 0 THEN 1 ELSE 0 END), 0), 2) as view_to_cart_rate,
  ROUND(100.0 * SUM(CASE WHEN started_checkout > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN added_to_cart > 0 THEN 1 ELSE 0 END), 0), 2) as cart_to_checkout_rate,
  ROUND(100.0 * SUM(CASE WHEN purchased > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN started_checkout > 0 THEN 1 ELSE 0 END), 0), 2) as checkout_to_purchase_rate,
  ROUND(100.0 * SUM(CASE WHEN purchased > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN viewed > 0 THEN 1 ELSE 0 END), 0), 2) as overall_conversion_rate
FROM funnel_stages;
```

---

## Database-Specific SQL in Metabase

### PostgreSQL

PostgreSQL-specific features available in Metabase:

```sql
-- JSON data handling
SELECT
  order_id,
  customer_id,
  order_data->>'shipping_address' as shipping_address,
  order_data->'items'->0->>'product_name' as first_product
FROM orders
WHERE order_data->>'payment_method' = 'Credit Card';

-- Array operations
SELECT
  product_id,
  product_name,
  array_length(categories, 1) as num_categories,
  categories[1] as primary_category
FROM products
WHERE 'Electronics' = ANY(categories);

-- Full-text search
SELECT
  product_id,
  product_name,
  description,
  ts_rank(to_tsvector('english', description), websearch_to_tsquery('english', {{search_term}})) as relevance
FROM products
WHERE to_tsvector('english', description) @@ websearch_to_tsquery('english', {{search_term}})
ORDER BY relevance DESC;
```

### MySQL

MySQL-specific features:

```sql
-- Date functions
SELECT
  order_id,
  order_date,
  DATEDIFF(ship_date, order_date) as days_to_ship,
  DATE_FORMAT(order_date, '%W, %M %e, %Y') as formatted_date,
  LAST_DAY(order_date) as last_day_of_month
FROM orders
WHERE QUARTER(order_date) = {{quarter}};

-- GROUP_CONCAT
SELECT
  customer_id,
  customer_name,
  COUNT(order_id) as num_orders,
  GROUP_CONCAT(order_id ORDER BY order_date SEPARATOR ', ') as order_ids
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY customer_id, customer_name;
```

### BigQuery

BigQuery features in Metabase:

```sql
-- Working with nested and repeated fields
SELECT
  user_id,
  event_date,
  (SELECT value FROM UNNEST(event_params) WHERE key = 'page') as page,
  (SELECT value FROM UNNEST(event_params) WHERE key = 'source') as source
FROM `my_project.analytics_data.events`
WHERE event_name = 'page_view'
LIMIT 1000;

-- Date partitioning
SELECT
  DATE_TRUNC(event_date, MONTH) as month,
  COUNT(*) as event_count
FROM `my_project.analytics_data.events`
WHERE _PARTITIONDATE BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND CURRENT_DATE()
GROUP BY month
ORDER BY month;
```

---

## SQL Optimization for Metabase

### Query Performance Tips

1. **Be selective with columns**:

   ```sql
   -- Instead of:
   SELECT * FROM orders;

   -- Use:
   SELECT order_id, customer_id, amount FROM orders;
   ```

2. **Limit results when appropriate**:

   ```sql
   SELECT * FROM large_table LIMIT 1000;
   ```

3. **Use appropriate indexes**:

   ```sql
   -- Check if an index would help:
   EXPLAIN ANALYZE SELECT * FROM orders WHERE order_date > '2023-01-01';

   -- Create an index if needed (outside of Metabase):
   CREATE INDEX idx_orders_date ON orders(order_date);
   ```

4. **Materialize complex calculations**:
   ```sql
   -- Instead of calculating in every query:
   WITH order_summary AS (
     SELECT
       customer_id,
       COUNT(*) as order_count,
       SUM(amount) as total_spent
     FROM orders
     GROUP BY customer_id
   )
   SELECT * FROM order_summary WHERE order_count > 5;
   ```

### Avoiding Common Pitfalls

1. **Avoid OR conditions when possible**:

   ```sql
   -- Instead of:
   SELECT * FROM products
   WHERE category = 'Electronics' OR category = 'Computers';

   -- Use:
   SELECT * FROM products
   WHERE category IN ('Electronics', 'Computers');
   ```

2. **Be careful with JOINs**:

   ```sql
   -- Use explicit JOIN type
   SELECT c.customer_name, o.order_id
   FROM customers c
   LEFT JOIN orders o ON c.customer_id = o.customer_id;

   -- Include only necessary tables
   -- Instead of joining 5 tables, can you get what you need from 3?
   ```

3. **Watch out for cartesian products**:

   ```sql
   -- This creates a row for every customer-product combination!
   SELECT c.customer_name, p.product_name
   FROM customers c, products p;

   -- Use proper joins instead
   ```

---

## Troubleshooting SQL Issues

### Common Metabase SQL Errors

1. **Syntax errors**: Check your SQL syntax, particularly:

   - Missing semicolons or commas
   - Unmatched parentheses
   - Reserved words used as column names without quotes

2. **Database-specific syntax**: Make sure you're using syntax compatible with your database:

   ```sql
   -- PostgreSQL concatenation
   first_name || ' ' || last_name

   -- MySQL concatenation
   CONCAT(first_name, ' ', last_name)
   ```

3. **Variable issues**: Ensure variables are properly defined:
   ```sql
   -- Check that your variable is defined with correct type
   WHERE order_date > {{date}}  -- date should be a Date variable
   ```

### Debugging Strategies

1. **Break down complex queries**:

   ```sql
   -- Instead of one massive query, build it up in steps
   WITH step1 AS (
     -- First logical step
     SELECT customer_id, COUNT(*) as order_count
     FROM orders
     GROUP BY customer_id
   ),
   step2 AS (
     -- Second logical step
     SELECT s1.*, c.customer_name
     FROM step1 s1
     JOIN customers c ON s1.customer_id = c.customer_id
   )
   SELECT * FROM step2 WHERE order_count > 10;
   ```

2. **Test parameters with hardcoded values**:

   ```sql
   -- Instead of:
   WHERE order_date BETWEEN {{start_date}} AND {{end_date}}

   -- First test with:
   WHERE order_date BETWEEN '2023-01-01' AND '2023-03-31'
   ```

3. **Use EXPLAIN to understand query execution**:

   ```sql
   EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
   ```

4. **Check data types**:
   ```sql
   -- To see column types in PostgreSQL:
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'orders';
   ```

---

## Practical Examples for Common Business Questions

### Sales Analysis

```sql
-- Monthly sales trends with year-over-year comparison
WITH
  monthly_sales AS (
    SELECT
      DATE_TRUNC('month', order_date) as month,
      SUM(amount) as revenue
    FROM orders
    WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 years')
    GROUP BY DATE_TRUNC('month', order_date)
  ),
  sales_with_previous_year AS (
    SELECT
      month,
      revenue,
      LAG(revenue, 12) OVER (ORDER BY month) as previous_year_revenue
    FROM monthly_sales
  )
SELECT
  month,
  revenue,
  previous_year_revenue,
  revenue - previous_year_revenue as yoy_difference,
  CASE
    WHEN previous_year_revenue IS NULL OR previous_year_revenue = 0 THEN NULL
    ELSE ROUND(100.0 * (revenue - previous_year_revenue) / previous_year_revenue, 2)
  END as yoy_pct_change
FROM sales_with_previous_year
ORDER BY month DESC;
```

### Customer Segmentation

```sql
-- RFM (Recency, Frequency, Monetary) segmentation
WITH
  customer_metrics AS (
    SELECT
      customer_id,
      CURRENT_DATE - MAX(order_date) as days_since_last_purchase,
      COUNT(*) as frequency,
      SUM(amount) as monetary
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '2 years'
    GROUP BY customer_id
  ),
  rfm_scores AS (
    SELECT
      customer_id,
      days_since_last_purchase,
      frequency,
      monetary,
      NTILE(5) OVER (ORDER BY days_since_last_purchase DESC) as r_score,
      NTILE(5) OVER (ORDER BY frequency) as f_score,
      NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM customer_metrics
  )
SELECT
  customer_id,
  r_score,
  f_score,
  m_score,
  r_score || f_score || m_score as rfm_score,
  CASE
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
    WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Loyal Customers'
    WHEN r_score >= 4 AND f_score >= 1 AND m_score >= 1 THEN 'Recent Customers'
    WHEN r_score >= 3 AND f_score >= 1 AND m_score >= 1 THEN 'Promising'
    WHEN r_score >= 2 AND f_score >= 2 AND m_score >= 2 THEN 'Customers Needing Attention'
    WHEN r_score >= 1 AND f_score >= 4 AND m_score >= 4 THEN 'At Risk'
    WHEN r_score >= 1 AND f_score >= 1 AND m_score >= 1 THEN 'Cant Lose Them'
    ELSE 'Lost'
  END as segment
FROM rfm_scores;
```

### Product Recommendations

```sql
-- Simple product affinity analysis (products often bought together)
SELECT
  p1.product_id as product1_id,
  p1.product_name as product1_name,
  p2.product_id as product2_id,
  p2.product_name as product2_name,
  COUNT(*) as co_purchase_count
FROM orders o
JOIN order_items oi1 ON o.order_id = oi1.order_id
JOIN products p1 ON oi1.product_id = p1.product_id
JOIN order_items oi2 ON o.order_id = oi2.order_id
JOIN products p2 ON oi2.product_id = p2.product_id
WHERE
  p1.product_id < p2.product_id  -- Avoid duplicates
  AND o.order_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY p1.product_id, p1.product_name, p2.product_id, p2.product_name
HAVING COUNT(*) >= 10  -- Minimum threshold for significance
ORDER BY co_purchase_count DESC
LIMIT 20;
```

---

## Resources and Further Learning

### Metabase-Specific Resources

- [Metabase Documentation](https://www.metabase.com/docs/latest/)
- [Writing SQL Queries in Metabase](https://www.metabase.com/learn/sql-questions/writing-sql)
- [Advanced Metabase Features](https://www.metabase.com/learn/administration/advanced-metabase-features)

### SQL Learning Resources

- [Mode Analytics SQL Tutorial](https://mode.com/sql-tutorial/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)

### Books on SQL Analytics

- "SQL for Data Analysis" by Cathy Tanimura
- "Practical SQL" by Anthony DeBarros
- "Data Analysis Using SQL and Excel" by Gordon S. Linoff

---

_Last updated: May 20, 2025_
