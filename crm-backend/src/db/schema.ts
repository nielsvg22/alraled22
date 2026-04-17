import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const customerGroups = sqliteTable('CustomerGroup', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull().unique(),
  discountPercent: real('discountPercent').notNull().default(0),
  vatReverseCharge: integer('vatReverseCharge').notNull().default(0),
  netPrices: integer('netPrices').notNull().default(1),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const users = sqliteTable('User', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role', { enum: ['USER', 'ADMIN'] }).notNull().default('USER'),
  customerGroupId: text('customerGroupId').references(() => customerGroups.id, { onDelete: 'set null' }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const products = sqliteTable('Product', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  imageUrl: text('imageUrl'),
  category: text('category'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const productPriceTiers = sqliteTable('ProductPriceTier', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minQty: integer('minQty').notNull(),
  price: real('price').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

export const orders = sqliteTable('Order', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id),
  total: real('total').notNull(),
  discountCodeId: text('discountCodeId').references(() => discountCodes.id),
  discountAmount: real('discountAmount').notNull().default(0),
  status: text('status', { enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] }).notNull().default('PENDING'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const productRelations = sqliteTable('ProductRelation', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  relatedProductId: text('relatedProductId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['UPSELL', 'CROSS_SELL', 'RELATED'] }).notNull().default('RELATED'),
});

export const discountCodes = sqliteTable('DiscountCode', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  code: text('code').notNull().unique(),
  type: text('type', { enum: ['PERCENTAGE', 'FIXED'] }).notNull().default('PERCENTAGE'),
  value: real('value').notNull(),
  minOrderAmount: real('minOrderAmount').notNull().default(0),
  startDate: text('startDate'),
  endDate: text('endDate'),
  usageLimit: integer('usageLimit'),
  usageCount: integer('usageCount').notNull().default(0),
  active: integer('active').notNull().default(1),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

export const orderItems = sqliteTable('OrderItem', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderId: text('orderId').notNull().references(() => orders.id),
  productId: text('productId').references(() => products.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});

export const rmas = sqliteTable('Rma', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderId: text('orderId').notNull().references(() => orders.id),
  userId: text('userId').notNull().references(() => users.id),
  status: text('status', { enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CLOSED'] }).notNull().default('REQUESTED'),
  reason: text('reason'),
  message: text('message'),
  adminNote: text('adminNote'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const rmaItems = sqliteTable('RmaItem', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  rmaId: text('rmaId').notNull().references(() => rmas.id),
  orderItemId: text('orderItemId').notNull().references(() => orderItems.id),
  quantity: integer('quantity').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  customerGroup: one(customerGroups, { fields: [users.customerGroupId], references: [customerGroups.id] }),
  orders: many(orders),
  rmas: many(rmas),
}));

export const customerGroupsRelations = relations(customerGroups, ({ many }) => ({
  users: many(users),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  priceTiers: many(productPriceTiers),
  relatedProducts: many(productRelations, { relationName: 'productToRelated' }),
  isRelatedTo: many(productRelations, { relationName: 'relatedToProduct' }),
}));

export const productRelationsRelations = relations(productRelations, ({ one }) => ({
  product: one(products, { fields: [productRelations.productId], references: [products.id], relationName: 'productToRelated' }),
  relatedProduct: one(products, { fields: [productRelations.relatedProductId], references: [products.id], relationName: 'relatedToProduct' }),
}));

export const discountCodesRelations = relations(discountCodes, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  discountCode: one(discountCodes, { fields: [orders.discountCodeId], references: [discountCodes.id] }),
  items: many(orderItems),
  rmas: many(rmas),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const productPriceTiersRelations = relations(productPriceTiers, ({ one }) => ({
  product: one(products, { fields: [productPriceTiers.productId], references: [products.id] }),
}));

export const rmasRelations = relations(rmas, ({ one, many }) => ({
  order: one(orders, { fields: [rmas.orderId], references: [orders.id] }),
  user: one(users, { fields: [rmas.userId], references: [users.id] }),
  items: many(rmaItems),
}));

export const rmaItemsRelations = relations(rmaItems, ({ one }) => ({
  rma: one(rmas, { fields: [rmaItems.rmaId], references: [rmas.id] }),
  orderItem: one(orderItems, { fields: [rmaItems.orderItemId], references: [orderItems.id] }),
}));

export const siteContent = sqliteTable('SiteContent', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const snelstartConfigs = sqliteTable('SnelstartConfig', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  apiKey: text('apiKey'),
  clientKey: text('clientKey'),
  ledgerNumberSales: text('ledgerNumberSales'),
  ledgerNumberVat21: text('ledgerNumberVat21'),
  ledgerNumberVat9: text('ledgerNumberVat9'),
  ledgerNumberVat0: text('ledgerNumberVat0'),
  ledgerNumberShipping: text('ledgerNumberShipping'),
  snelstartVatCode21: text('snelstartVatCode21'),
  snelstartVatCode9: text('snelstartVatCode9'),
  snelstartVatCode0: text('snelstartVatCode0'),
  enabled: integer('enabled').notNull().default(0),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const snelstartSyncLogs = sqliteTable('SnelstartSyncLog', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderId: text('orderId').notNull().references(() => orders.id),
  status: text('status', { enum: ['SUCCESS', 'FAILED'] }).notNull(),
  errorMessage: text('errorMessage'),
  syncedAt: text('syncedAt').notNull().default(sql`(datetime('now'))`),
});

export const snelstartLedgers = sqliteTable('SnelstartLedger', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['SALES', 'VAT', 'SHIPPING', 'OTHER'] }).notNull().default('OTHER'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

export const snelstartSyncLogsRelations = relations(snelstartSyncLogs, ({ one }) => ({
  order: one(orders, { fields: [snelstartSyncLogs.orderId], references: [orders.id] }),
}));
