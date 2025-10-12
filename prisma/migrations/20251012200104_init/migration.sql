-- CreateTable
CREATE TABLE "allegro_mapper" (
    "ean" VARCHAR(20),
    "id_oferty" VARCHAR(20),
    "id_produktu" VARCHAR(50),
    "kategoria_glowna" VARCHAR(100),
    "podkategoria" VARCHAR(100),
    "sku" VARCHAR(50),
    "tytul_oferty" TEXT
);

-- CreateTable
CREATE TABLE "allegro_offer_list_costs_summary" (
    "id" SERIAL NOT NULL,
    "reporting_period" VARCHAR(100) NOT NULL,
    "oferta" VARCHAR(255),
    "offer_number" VARCHAR(100) NOT NULL,
    "offer_status" VARCHAR(50) NOT NULL,
    "sales_and_delivery_value_pln" DECIMAL(12,2),
    "fees_pln" DECIMAL(12,2),
    "sales_and_delivery_percentage" DECIMAL(8,4),
    "units_sold" INTEGER,
    "margin" DECIMAL(8,4),
    "campaign_sales_commission" DECIMAL(12,2),
    "coin_fee" DECIMAL(12,2),
    "dpd_operator_basic_fees" DECIMAL(12,2),
    "ups_operator_basic_fees" DECIMAL(12,2),
    "one_operator_basic_fees" DECIMAL(12,2),
    "dhl_operator_basic_fees" DECIMAL(12,2),
    "orlen_operator_basic_fees" DECIMAL(12,2),
    "highlighting_fee" DECIMAL(12,2),
    "highlighted_offer_sales_commission" DECIMAL(12,2),
    "dpd_shipping" DECIMAL(12,2),
    "allegro_inpost_lockers" DECIMAL(12,2),
    "xpress_shipping" DECIMAL(12,2),
    "sales_commission" DECIMAL(12,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "source_currency" VARCHAR(3),
    "conversion_date" DATE,
    "ean" VARCHAR(255),
    "sku" VARCHAR(255),
    "id_produktu" VARCHAR(255),

    CONSTRAINT "allegro_offer_list_costs_summary_pkey1" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_of_goods" (
    "ean" VARCHAR(50),
    "cost_of_goods" DECIMAL(10,2),
    "currency" VARCHAR(3),
    "supply_date" DATE,
    "supply_date_pln" DECIMAL(15,4)
);

-- CreateTable
CREATE TABLE "delivery_cost" (
    "sku" VARCHAR(50),
    "delivery_cost" DECIMAL,
    "ean" VARCHAR(20),
    "currency" CHAR(3),
    "supply_date" DATE,
    "supply_date_pln" DECIMAL(15,4)
);

-- CreateTable
CREATE TABLE "merged_reports" (
    "id" SERIAL NOT NULL,
    "id_produktu" VARCHAR(255) NOT NULL,
    "ean" VARCHAR(255),
    "sku" VARCHAR(255),
    "produkt" TEXT,
    "sprzedane_sztuki" DECIMAL(15,2),
    "sr_cena_oferty" DECIMAL(15,2),
    "wartosc_sprzedazy" DECIMAL(15,2),
    "dochod_pln" DECIMAL(15,2),
    "dochod_percent" DECIMAL(8,4),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "oplaty_allegro" DECIMAL(15,2),
    "cost_of_goods" DECIMAL(15,2),
    "delivery_cost" DECIMAL(15,2),

    CONSTRAINT "merged_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices_data" (
    "sku" VARCHAR NOT NULL,
    "min_price" DECIMAL(10,2) DEFAULT 0,
    "id" SERIAL NOT NULL,
    "calculated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "cost_of_goods" DECIMAL(10,2),
    "delivery_cost" DECIMAL(10,2),
    "multiplier_used" DECIMAL(4,2),
    "strategy_used" VARCHAR(20),

    CONSTRAINT "prices_data_pk" PRIMARY KEY ("sku")
);

-- CreateIndex
CREATE INDEX "idx_allegro_mapper_ean" ON "allegro_mapper"("ean");

-- CreateIndex
CREATE INDEX "idx_allegro_mapper_id_oferty" ON "allegro_mapper"("id_oferty");

-- CreateIndex
CREATE INDEX "idx_allegro_costs_ean" ON "allegro_offer_list_costs_summary"("ean");

-- CreateIndex
CREATE INDEX "idx_allegro_costs_id_produktu" ON "allegro_offer_list_costs_summary"("id_produktu");

-- CreateIndex
CREATE INDEX "idx_allegro_costs_sku" ON "allegro_offer_list_costs_summary"("sku");

-- CreateIndex
CREATE INDEX "idx_allegro_created_at" ON "allegro_offer_list_costs_summary"("created_at");

-- CreateIndex
CREATE INDEX "idx_allegro_offer_number" ON "allegro_offer_list_costs_summary"("offer_number");

-- CreateIndex
CREATE INDEX "idx_allegro_offer_number_period" ON "allegro_offer_list_costs_summary"("offer_number", "reporting_period");

-- CreateIndex
CREATE INDEX "idx_allegro_offer_period_status" ON "allegro_offer_list_costs_summary"("reporting_period", "offer_status");

-- CreateIndex
CREATE INDEX "idx_allegro_offer_status" ON "allegro_offer_list_costs_summary"("offer_status");

-- CreateIndex
CREATE INDEX "idx_allegro_reporting_period" ON "allegro_offer_list_costs_summary"("reporting_period");

-- CreateIndex
CREATE INDEX "idx_allegro_updated_at" ON "allegro_offer_list_costs_summary"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "uk_allegro_offer_dedup" ON "allegro_offer_list_costs_summary"("offer_number", "offer_status", "reporting_period");

-- CreateIndex
CREATE UNIQUE INDEX "idx_cost_of_goods_ean" ON "cost_of_goods"("ean");

-- CreateIndex
CREATE INDEX "idx_cost_of_goods_supply_date" ON "cost_of_goods"("supply_date");

-- CreateIndex
CREATE INDEX "idx_cost_of_goods_supply_date_pln" ON "cost_of_goods"("supply_date_pln");

-- CreateIndex
CREATE INDEX "idx_delivery_cost_sku" ON "delivery_cost"("sku");

-- CreateIndex
CREATE INDEX "idx_delivery_cost_supply_date" ON "delivery_cost"("supply_date");

-- CreateIndex
CREATE INDEX "idx_delivery_cost_supply_date_pln" ON "delivery_cost"("supply_date_pln");

-- CreateIndex
CREATE UNIQUE INDEX "idx_delivery_cost_ean_sku" ON "delivery_cost"("ean", "sku");

-- CreateIndex
CREATE INDEX "idx_merged_reports_dochod_pln" ON "merged_reports"("dochod_pln" DESC);

-- CreateIndex
CREATE INDEX "idx_merged_reports_ean" ON "merged_reports"("ean");

-- CreateIndex
CREATE INDEX "idx_merged_reports_id_produktu" ON "merged_reports"("id_produktu");

-- CreateIndex
CREATE INDEX "idx_merged_reports_sku" ON "merged_reports"("sku");

-- CreateIndex
CREATE INDEX "idx_prices_data_calculated_at" ON "prices_data"("calculated_at");

-- CreateIndex
CREATE INDEX "idx_prices_data_min_price" ON "prices_data"("min_price");

-- CreateIndex
CREATE INDEX "idx_prices_data_sku" ON "prices_data"("sku");

-- CreateIndex
CREATE INDEX "idx_prices_data_updated_at" ON "prices_data"("updated_at");
