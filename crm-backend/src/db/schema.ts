import { mysqlTable, varchar, double, int, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const customerGroups = mysqlTable('CustomerGroup', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  discountPercent: double('discountPercent').notNull().default(0),
  vatReverseCharge: int('vatReverseCharge').notNull().default(0),
  netPrices: int('netPrices').notNull().default(1),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const users = mysqlTable('User', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: mysqlEnum('role', ['USER', 'ADMIN']).notNull().default('USER'),
  customerGroupId: varchar('customerGroupId', { length: 36 }).references(() => customerGroups.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const products = mysqlTable('Product', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: double('price').notNull(),
  stock: int('stock').notNull().default(0),
  imageUrl: varchar('imageUrl', { length: 512 }),
  category: varchar('category', { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const productPriceTiers = mysqlTable('ProductPriceTier', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  productId: varchar('productId', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  minQty: int('minQty').notNull(),
  price: double('price').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const orders = mysqlTable('Order', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  userId: varchar('userId', { length: 36 }).notNull().references(() => users.id),
  total: double('total').notNull(),
  discountCodeId: varchar('discountCodeId', { length: 36 }).references(() => discountCodes.id),
  discountAmount: double('discountAmount').notNull().default(0),
  status: mysqlEnum('status', ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).notNull().default('PENDING'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const productRelations = mysqlTable('ProductRelation', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  productId: varchar('productId', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  relatedProductId: varchar('relatedProductId', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: mysqlEnum('type', ['UPSELL', 'CROSS_SELL', 'RELATED']).notNull().default('RELATED'),
});

export const discountCodes = mysqlTable('DiscountCode', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: mysqlEnum('type', ['PERCENTAGE', 'FIXED']).notNull().default('PERCENTAGE'),
  value: double('value').notNull(),
  minOrderAmount: double('minOrderAmount').notNull().default(0),
  startDate: timestamp('startDate'),
  endDate: timestamp('endDate'),
  usageLimit: int('usageLimit'),
  usageCount: int('usageCount').notNull().default(0),
  active: int('active').notNull().default(1),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const orderItems = mysqlTable('OrderItem', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  orderId: varchar('orderId', { length: 36 }).notNull().references(() => orders.id),
  productId: varchar('productId', { length: 36 }).references(() => products.id, { onDelete: 'set null' }),
  quantity: int('quantity').notNull(),
  price: double('price').notNull(),
});

export const rmas = mysqlTable('Rma', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  orderId: varchar('orderId', { length: 36 }).notNull().references(() => orders.id),
  userId: varchar('userId', { length: 36 }).notNull().references(() => users.id),
  status: mysqlEnum('status', ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CLOSED']).notNull().default('REQUESTED'),
  reason: text('reason'),
  message: text('message'),
  adminNote: text('adminNote'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const rmaItems = mysqlTable('RmaItem', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  rmaId: varchar('rmaId', { length: 36 }).notNull().references(() => rmas.id),
  orderItemId: varchar('orderItemId', { length: 36 }).notNull().references(() => orderItems.id),
  quantity: int('quantity').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
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

export const siteContent = mysqlTable('SiteContent', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const snelstartConfigs = mysqlTable('SnelstartConfig', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  apiKey: varchar('apiKey', { length: 255 }),
  clientKey: varchar('clientKey', { length: 255 }),
  ledgerNumberSales: varchar('ledgerNumberSales', { length: 50 }),
  ledgerNumberVat21: varchar('ledgerNumberVat21', { length: 50 }),
  ledgerNumberVat9: varchar('ledgerNumberVat9', { length: 50 }),
  ledgerNumberVat0: varchar('ledgerNumberVat0', { length: 50 }),
  ledgerNumberShipping: varchar('ledgerNumberShipping', { length: 50 }),
  snelstartVatCode21: varchar('snelstartVatCode21', { length: 50 }),
  snelstartVatCode9: varchar('snelstartVatCode9', { length: 50 }),
  snelstartVatCode0: varchar('snelstartVatCode0', { length: 50 }),
  enabled: int('enabled').notNull().default(0),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
});

export const snelstartSyncLogs = mysqlTable('SnelstartSyncLog', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  orderId: varchar('orderId', { length: 36 }).notNull().references(() => orders.id),
  status: mysqlEnum('status', ['SUCCESS', 'FAILED']).notNull(),
  errorMessage: text('errorMessage'),
  syncedAt: timestamp('syncedAt').notNull().defaultNow(),
});

export const snelstartLedgers = mysqlTable('SnelstartLedger', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['SALES', 'VAT', 'SHIPPING', 'OTHER']).notNull().default('OTHER'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const snelstartSyncLogsRelations = relations(snelstartSyncLogs, ({ one }) => ({
  order: one(orders, { fields: [snelstartSyncLogs.orderId], references: [orders.id] }),
}));
