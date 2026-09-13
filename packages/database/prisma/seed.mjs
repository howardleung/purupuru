import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const verifiedAt = new Date("2026-09-12T00:00:00.000Z");

const taxonomy = [
  { slug: "skincare", displayName: "Skincare", parentSlug: null, sortOrder: 0 },
  { slug: "cleansers", displayName: "Cleansers", parentSlug: "skincare", sortOrder: 10 },
  { slug: "facial-cleanser", displayName: "Facial Cleanser", parentSlug: "cleansers", sortOrder: 10 },
  { slug: "oil-cleanser", displayName: "Oil Cleanser", parentSlug: "cleansers", sortOrder: 20 },
  { slug: "balm-cleanser", displayName: "Balm Cleanser", parentSlug: "cleansers", sortOrder: 30 },
  { slug: "makeup-remover", displayName: "Makeup Remover", parentSlug: "cleansers", sortOrder: 40 },
  { slug: "toners", displayName: "Toners", parentSlug: "skincare", sortOrder: 20 },
  { slug: "toner", displayName: "Toner", parentSlug: "toners", sortOrder: 10 },
  { slug: "essence", displayName: "Essence", parentSlug: "toners", sortOrder: 20 },
  { slug: "toner-pads", displayName: "Toner Pads", parentSlug: "toners", sortOrder: 30 },
  { slug: "facial-mist", displayName: "Facial Mist", parentSlug: "toners", sortOrder: 40 },
  { slug: "moisturizers", displayName: "Moisturizers", parentSlug: "skincare", sortOrder: 30 },
  { slug: "cream", displayName: "Cream", parentSlug: "moisturizers", sortOrder: 10 },
  { slug: "lotion", displayName: "Lotion", parentSlug: "moisturizers", sortOrder: 20 },
  { slug: "gel-moisturizer", displayName: "Gel Moisturizer", parentSlug: "moisturizers", sortOrder: 30 },
  { slug: "face-oil", displayName: "Face Oil", parentSlug: "moisturizers", sortOrder: 40 },
  { slug: "treatments", displayName: "Treatments", parentSlug: "skincare", sortOrder: 40 },
  { slug: "serum-ampoule", displayName: "Serum / Ampoule", parentSlug: "treatments", sortOrder: 10 },
  { slug: "spot-treatment", displayName: "Spot Treatment", parentSlug: "treatments", sortOrder: 20 },
  { slug: "exfoliant", displayName: "Exfoliant", parentSlug: "treatments", sortOrder: 30 },
  { slug: "pimple-patch", displayName: "Pimple Patch", parentSlug: "treatments", sortOrder: 40 },
  { slug: "sunscreen", displayName: "Sunscreen", parentSlug: "skincare", sortOrder: 50 },
  { slug: "masks", displayName: "Masks", parentSlug: "skincare", sortOrder: 60 },
  { slug: "sheet-mask", displayName: "Sheet Mask", parentSlug: "masks", sortOrder: 10 },
  { slug: "eye-mask", displayName: "Eye Mask", parentSlug: "masks", sortOrder: 20 },
  { slug: "wash-off-mask", displayName: "Wash-Off Mask", parentSlug: "masks", sortOrder: 30 },
  { slug: "eye-care", displayName: "Eye Care", parentSlug: "skincare", sortOrder: 70 },
  { slug: "lip-care", displayName: "Lip Care", parentSlug: "skincare", sortOrder: 80 },
];

async function seedTaxonomy() {
  const categories = new Map();

  for (const category of taxonomy) {
    const parent = category.parentSlug ? categories.get(category.parentSlug) : null;
    const saved = await prisma.canonicalCategory.upsert({
      where: { slug: category.slug },
      update: {
        displayName: category.displayName,
        department: "SKINCARE",
        parentCategoryId: parent?.id ?? null,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        slug: category.slug,
        displayName: category.displayName,
        department: "SKINCARE",
        parentCategoryId: parent?.id ?? null,
        sortOrder: category.sortOrder,
      },
    });
    categories.set(category.slug, saved);
  }

  return categories;
}

async function upsertVariant(productVersionId, data) {
  return prisma.productVariant.upsert({
    where: {
      productVersionId_normalizedQuantity_normalizedUnit: {
        productVersionId,
        normalizedQuantity: data.normalizedQuantity,
        normalizedUnit: data.normalizedUnit,
      },
    },
    update: {
      displaySize: data.displaySize,
      gtin: data.gtin,
      manufacturerSku: data.manufacturerSku,
      isActive: true,
    },
    create: {
      productVersionId,
      ...data,
    },
  });
}

async function upsertRetailer(data) {
  return prisma.retailer.upsert({
    where: { sourceKey: data.sourceKey },
    update: data,
    create: data,
  });
}

async function upsertOffer(retailerId, productVariantId, data) {
  const where = data.retailerListingId
    ? {
        retailerId_retailerListingId: {
          retailerId,
          retailerListingId: data.retailerListingId,
        },
      }
    : {
        retailerId_listingUrl: {
          retailerId,
          listingUrl: data.listingUrl,
        },
      };

  return prisma.offer.upsert({
    where,
    update: {
      productVariantId,
      ...data,
      lastVerifiedAt: verifiedAt,
      observedAt: verifiedAt,
      isActive: true,
    },
    create: {
      retailerId,
      productVariantId,
      ...data,
      lastVerifiedAt: verifiedAt,
      observedAt: verifiedAt,
    },
  });
}

async function main() {
  const categories = await seedTaxonomy();
  const tonerCategory = categories.get("toner");
  const sunscreenCategory = categories.get("sunscreen");

  const roundLab = await prisma.brand.upsert({
    where: { slug: "round-lab" },
    update: {
      name: "Round Lab",
      originMarket: "KR",
      aliases: ["ROUND LAB"],
    },
    create: {
      name: "Round Lab",
      slug: "round-lab",
      originMarket: "KR",
      aliases: ["ROUND LAB"],
    },
  });

  const anessa = await prisma.brand.upsert({
    where: { slug: "anessa" },
    update: {
      name: "ANESSA",
      originMarket: "JP",
      aliases: ["Anessa", "Shiseido ANESSA"],
    },
    create: {
      name: "ANESSA",
      slug: "anessa",
      originMarket: "JP",
      aliases: ["Anessa", "Shiseido ANESSA"],
    },
  });

  const dokdoFamily = await prisma.productFamily.upsert({
    where: { slug: "round-lab-1025-dokdo-toner" },
    update: {
      brandId: roundLab.id,
      primaryCanonicalCategoryId: tonerCategory.id,
      canonicalName: "1025 Dokdo Toner",
      originMarket: "KR",
      commonEnglishAliases: ["Dokdo Toner", "Round Lab Dokdo Toner"],
    },
    create: {
      brandId: roundLab.id,
      primaryCanonicalCategoryId: tonerCategory.id,
      canonicalName: "1025 Dokdo Toner",
      slug: "round-lab-1025-dokdo-toner",
      originMarket: "KR",
      commonEnglishAliases: ["Dokdo Toner", "Round Lab Dokdo Toner"],
    },
  });

  const dokdoVersion = await prisma.productVersion.upsert({
    where: {
      productFamilyId_versionName: {
        productFamilyId: dokdoFamily.id,
        versionName: "Current formulation",
      },
    },
    update: {
      versionCode: "current",
      status: "CURRENT",
      packagingDescription: "Clear bottle with blue 1025 Dokdo label.",
    },
    create: {
      productFamilyId: dokdoFamily.id,
      versionName: "Current formulation",
      versionCode: "current",
      status: "CURRENT",
      packagingDescription: "Clear bottle with blue 1025 Dokdo label.",
    },
  });

  const dokdo200 = await upsertVariant(dokdoVersion.id, {
    normalizedQuantity: 200,
    normalizedUnit: "ml",
    displaySize: "200 mL",
    gtin: "8809657114731",
    manufacturerSku: null,
  });
  const dokdo500 = await upsertVariant(dokdoVersion.id, {
    normalizedQuantity: 500,
    normalizedUnit: "ml",
    displaySize: "500 mL",
    gtin: null,
    manufacturerSku: "round-lab-dokdo-toner-500ml",
  });

  await prisma.productVersion.update({
    where: { id: dokdoVersion.id },
    data: { defaultVariantId: dokdo200.id },
  });
  await prisma.productFamily.update({
    where: { id: dokdoFamily.id },
    data: { currentVersionId: dokdoVersion.id },
  });

  const anessaFamily = await prisma.productFamily.upsert({
    where: { slug: "anessa-perfect-uv-skincare-gel" },
    update: {
      brandId: anessa.id,
      primaryCanonicalCategoryId: sunscreenCategory.id,
      canonicalName: "Perfect UV Skincare Gel",
      originMarket: "JP",
      commonEnglishAliases: ["Perfect UV Sunscreen Skincare Gel", "ANESSA Gold Gel"],
    },
    create: {
      brandId: anessa.id,
      primaryCanonicalCategoryId: sunscreenCategory.id,
      canonicalName: "Perfect UV Skincare Gel",
      slug: "anessa-perfect-uv-skincare-gel",
      originMarket: "JP",
      commonEnglishAliases: ["Perfect UV Sunscreen Skincare Gel", "ANESSA Gold Gel"],
    },
  });

  const anessaNb = await prisma.productVersion.upsert({
    where: {
      productFamilyId_versionName: {
        productFamilyId: anessaFamily.id,
        versionName: "2026 NB",
      },
    },
    update: {
      versionCode: "NB",
      releaseDate: new Date("2026-02-21T00:00:00.000Z"),
      status: "CURRENT",
      manufacturerVersionCode: "NB",
      packagingDescription: "2026 gold-tube formulation.",
    },
    create: {
      productFamilyId: anessaFamily.id,
      versionName: "2026 NB",
      versionCode: "NB",
      releaseDate: new Date("2026-02-21T00:00:00.000Z"),
      status: "CURRENT",
      manufacturerVersionCode: "NB",
      packagingDescription: "2026 gold-tube formulation.",
    },
  });

  const anessaNa = await prisma.productVersion.upsert({
    where: {
      productFamilyId_versionName: {
        productFamilyId: anessaFamily.id,
        versionName: "2024 NA",
      },
    },
    update: {
      versionCode: "NA",
      releaseDate: null,
      status: "PREVIOUS",
      manufacturerVersionCode: "NA",
      packagingDescription: "Previous gold-tube formulation.",
    },
    create: {
      productFamilyId: anessaFamily.id,
      versionName: "2024 NA",
      versionCode: "NA",
      releaseDate: null,
      status: "PREVIOUS",
      manufacturerVersionCode: "NA",
      packagingDescription: "Previous gold-tube formulation.",
    },
  });

  const anessaNb40 = await upsertVariant(anessaNb.id, {
    normalizedQuantity: 40,
    normalizedUnit: "g",
    displaySize: "40 g",
    gtin: null,
    manufacturerSku: "anessa-nb-40g",
  });
  const anessaNb90 = await upsertVariant(anessaNb.id, {
    normalizedQuantity: 90,
    normalizedUnit: "g",
    displaySize: "90 g",
    gtin: "4909978228545",
    manufacturerSku: "H91002",
  });
  const anessaNa90 = await upsertVariant(anessaNa.id, {
    normalizedQuantity: 90,
    normalizedUnit: "g",
    displaySize: "90 g",
    gtin: null,
    manufacturerSku: "anessa-na-90g",
  });

  await prisma.productVersion.update({
    where: { id: anessaNb.id },
    data: { defaultVariantId: anessaNb90.id },
  });
  await prisma.productVersion.update({
    where: { id: anessaNa.id },
    data: { defaultVariantId: anessaNa90.id },
  });
  await prisma.productFamily.update({
    where: { id: anessaFamily.id },
    data: { currentVersionId: anessaNb.id },
  });

  const well = await upsertRetailer({
    sourceKey: "retailer:well-ca",
    name: "Well.ca",
    country: "CA",
    websiteUrl: "https://well.ca",
    reliabilityNote: "Canadian retailer product page.",
  });
  const shoppers = await upsertRetailer({
    sourceKey: "retailer:shoppers-drug-mart-ca",
    name: "Shoppers Drug Mart",
    country: "CA",
    websiteUrl: "https://www.shoppersdrugmart.ca",
    reliabilityNote: "Canadian retailer product page.",
  });
  const roundLabOfficial = await upsertRetailer({
    sourceKey: "retailer:round-lab-kr",
    name: "Round Lab Korea",
    country: "KR",
    websiteUrl: "https://roundlab.co.kr",
    reliabilityNote: "Official Korean brand store.",
  });
  const shiseidoJapan = await upsertRetailer({
    sourceKey: "retailer:shiseido-beauty-key-jp",
    name: "Shiseido Beauty Key",
    country: "JP",
    websiteUrl: "https://www.shiseido.co.jp",
    reliabilityNote: "Official Japanese product catalogue and store.",
  });
  const japaneseTaste = await upsertRetailer({
    sourceKey: "retailer:japanese-taste-ca",
    name: "Japanese Taste",
    country: "JP",
    websiteUrl: "https://japanesetaste.ca",
    reliabilityNote: "International retailer storefront for Canada.",
  });

  await prisma.sourceCategoryMapping.upsert({
    where: {
      sourceKey_sourceCategoryPath: {
        sourceKey: roundLabOfficial.sourceKey,
        sourceCategoryPath: "유형별 > 토너/미스트",
      },
    },
    update: {
      retailerId: roundLabOfficial.id,
      canonicalCategoryId: tonerCategory.id,
      confidence: 100,
      isVerified: true,
    },
    create: {
      sourceKey: roundLabOfficial.sourceKey,
      sourceCategoryPath: "유형별 > 토너/미스트",
      retailerId: roundLabOfficial.id,
      canonicalCategoryId: tonerCategory.id,
      confidence: 100,
      isVerified: true,
    },
  });

  await prisma.sourceCategoryMapping.upsert({
    where: {
      sourceKey_sourceCategoryPath: {
        sourceKey: "brand:shiseido",
        sourceCategoryPath: "日焼け止め用ジェル",
      },
    },
    update: {
      retailerId: shiseidoJapan.id,
      canonicalCategoryId: sunscreenCategory.id,
      confidence: 100,
      isVerified: true,
    },
    create: {
      sourceKey: "brand:shiseido",
      sourceCategoryPath: "日焼け止め用ジェル",
      retailerId: shiseidoJapan.id,
      canonicalCategoryId: sunscreenCategory.id,
      confidence: 100,
      isVerified: true,
    },
  });

  const dokdoWellOffer = await upsertOffer(well.id, dokdo200.id, {
    retailerListingId: "327666",
    listingUrl: "https://well.ca/products/round-lab-1025-dokdo-toner_327666.html",
    productPrice: 17.99,
    nativeCurrency: "CAD",
    availableMarkets: ["CA"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: null,
    shippingAmount: null,
    shippingCurrency: null,
    deliveryMethod: null,
    deliveryEstimate: null,
    shippingConditions: null,
    primaryQuantity: 1,
  });

  const dokdoShoppersOffer = await upsertOffer(shoppers.id, dokdo200.id, {
    retailerListingId: "8809657114731",
    listingUrl: "https://www.shoppersdrugmart.ca/round-lab-1025-dokdo-toner/p/BB_8809657114731?variantCode=8809657114731",
    productPrice: 20,
    nativeCurrency: "CAD",
    availableMarkets: ["CA"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: "CALCULATED",
    shippingAmount: null,
    shippingCurrency: null,
    deliveryMethod: "Delivery or pickup",
    deliveryEstimate: null,
    shippingConditions: "Free shipping may apply at the retailer threshold.",
    primaryQuantity: 1,
  });

  await upsertOffer(roundLabOfficial.id, dokdo200.id, {
    retailerListingId: "22",
    listingUrl: "https://roundlab.co.kr/product/1025-%EB%8F%85%EB%8F%84-%ED%86%A0%EB%84%88-200ml/22/category/50/display/1/",
    productPrice: 11900,
    nativeCurrency: "KRW",
    availableMarkets: ["KR"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: "FIXED",
    shippingAmount: 2500,
    shippingCurrency: "KRW",
    deliveryMethod: "Courier",
    deliveryEstimate: "1–3 days",
    shippingConditions: "Free domestic shipping from ₩15,000.",
    primaryQuantity: 1,
  });

  await upsertOffer(roundLabOfficial.id, dokdo500.id, {
    retailerListingId: "14",
    listingUrl: "https://roundlab.co.kr/product/1025-%EB%8F%85%EB%8F%84-%ED%86%A0%EB%84%88-%EB%8C%80%EC%9A%A9%EB%9F%89-500ml/14/category/50/display/1/",
    productPrice: 23000,
    nativeCurrency: "KRW",
    availableMarkets: ["KR"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: "FREE",
    shippingAmount: 0,
    shippingCurrency: "KRW",
    deliveryMethod: "Courier",
    deliveryEstimate: "1–3 days",
    shippingConditions: "Qualifies for domestic free shipping.",
    primaryQuantity: 1,
  });

  const dokdoBundle = await upsertOffer(roundLabOfficial.id, dokdo200.id, {
    retailerListingId: "dokdo-toner-200-500-set",
    listingUrl: "https://roundlab.co.kr/product/list.html?cate_no=50",
    productPrice: 40000,
    nativeCurrency: "KRW",
    availableMarkets: ["KR"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: "FREE",
    shippingAmount: 0,
    shippingCurrency: "KRW",
    deliveryMethod: "Courier",
    deliveryEstimate: "1–3 days",
    shippingConditions: "Qualifies for domestic free shipping.",
    primaryQuantity: 1,
  });

  await prisma.offerItem.deleteMany({ where: { offerId: dokdoBundle.id } });
  await prisma.offerItem.createMany({
    data: [
      {
        offerId: dokdoBundle.id,
        relatedProductVariantId: dokdo200.id,
        label: "1025 Dokdo Toner 200 mL",
        quantity: 1,
        itemType: "SAME_PRODUCT",
        isPromotional: false,
      },
      {
        offerId: dokdoBundle.id,
        relatedProductVariantId: dokdo500.id,
        label: "1025 Dokdo Toner 500 mL",
        quantity: 1,
        itemType: "SAME_PRODUCT",
        isPromotional: false,
      },
    ],
  });

  await upsertOffer(japaneseTaste.id, anessaNb90.id, {
    retailerListingId: "44294026363200",
    listingUrl: "https://japanesetaste.ca/products/anessa-moisture-perfect-uv-sunscreen-skincare-gel-nb-spf50-90g",
    productPrice: 41.97,
    nativeCurrency: "CAD",
    availableMarkets: ["CA"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: "CALCULATED",
    shippingAmount: null,
    shippingCurrency: null,
    deliveryMethod: null,
    deliveryEstimate: null,
    shippingConditions: "Calculated by the retailer at checkout.",
    primaryQuantity: 1,
  });

  const anessaShiseidoOffer = await upsertOffer(shiseidoJapan.id, anessaNb90.id, {
    retailerListingId: "H91002",
    listingUrl: "https://www.shiseido.co.jp/sw/products/auth/SWFG070410.seam?online_shohin_ctlg_kbn=2&shohin_pl_c_cd=H91002",
    productPrice: 2508,
    nativeCurrency: "JPY",
    availableMarkets: ["JP"],
    cadConvertedPrice: null,
    cadFxTimestamp: null,
    availabilityState: "IN_STOCK",
    shippingState: null,
    shippingAmount: null,
    shippingCurrency: null,
    deliveryMethod: null,
    deliveryEstimate: null,
    shippingConditions: null,
    primaryQuantity: 1,
  });

  const demoPriceHistory = [
    {
      offerId: dokdoWellOffer.id,
      productVariantId: dokdo200.id,
      retailerId: well.id,
      retailerName: well.name,
      amount: 21.99,
      nativeCurrency: "CAD",
      observedAt: new Date("2026-07-15T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://well.ca/products/round-lab-1025-dokdo-toner_327666.html",
    },
    {
      offerId: dokdoWellOffer.id,
      productVariantId: dokdo200.id,
      retailerId: well.id,
      retailerName: well.name,
      amount: 19.99,
      nativeCurrency: "CAD",
      observedAt: new Date("2026-08-15T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://well.ca/products/round-lab-1025-dokdo-toner_327666.html",
    },
    {
      offerId: dokdoWellOffer.id,
      productVariantId: dokdo200.id,
      retailerId: well.id,
      retailerName: well.name,
      amount: 17.99,
      nativeCurrency: "CAD",
      observedAt: new Date("2026-09-11T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://well.ca/products/round-lab-1025-dokdo-toner_327666.html",
    },
    {
      offerId: dokdoShoppersOffer.id,
      productVariantId: dokdo200.id,
      retailerId: shoppers.id,
      retailerName: shoppers.name,
      amount: 22.99,
      nativeCurrency: "CAD",
      observedAt: new Date("2026-07-20T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://www.shoppersdrugmart.ca/round-lab-1025-dokdo-toner/p/BB_8809657114731?variantCode=8809657114731",
    },
    {
      offerId: dokdoShoppersOffer.id,
      productVariantId: dokdo200.id,
      retailerId: shoppers.id,
      retailerName: shoppers.name,
      amount: 20,
      nativeCurrency: "CAD",
      observedAt: new Date("2026-09-11T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://www.shoppersdrugmart.ca/round-lab-1025-dokdo-toner/p/BB_8809657114731?variantCode=8809657114731",
    },
    {
      offerId: anessaShiseidoOffer.id,
      productVariantId: anessaNb90.id,
      retailerId: shiseidoJapan.id,
      retailerName: shiseidoJapan.name,
      amount: 2508,
      nativeCurrency: "JPY",
      observedAt: new Date("2026-09-11T00:00:00.000Z"),
      verificationType: "OTHER",
      sourceUrl: "https://www.shiseido.co.jp/sw/products/auth/SWFG070410.seam?online_shohin_ctlg_kbn=2&shohin_pl_c_cd=H91002",
    },
  ];

  await prisma.priceObservation.deleteMany({
    where: {
      OR: demoPriceHistory.map((observation) => ({
        productVariantId: observation.productVariantId,
        retailerId: observation.retailerId,
        sourceUrl: observation.sourceUrl,
        observedAt: observation.observedAt,
        verificationType: observation.verificationType,
      })),
    },
  });
  await prisma.priceObservation.createMany({ data: demoPriceHistory });

  await prisma.benchmarkPrice.deleteMany({
    where: {
      productVariantId: { in: [dokdo200.id, dokdo500.id, anessaNb40.id, anessaNb90.id] },
      sourceKey: { in: ["brand:round-lab", "brand:shiseido"] },
    },
  });

  await prisma.benchmarkPrice.createMany({
    data: [
      {
        productVariantId: dokdo200.id,
        market: "KR",
        type: "RETAIL_PRICE",
        amount: 15000,
        nativeCurrency: "KRW",
        sourceKey: "brand:round-lab",
        sourceDisplayName: "Round Lab Korea",
        sourceUrl: "https://roundlab.co.kr/product/1025-%EB%8F%85%EB%8F%84-%ED%86%A0%EB%84%88-200ml/22/category/50/display/1/",
        observedAt: verifiedAt,
        verifiedAt,
      },
      {
        productVariantId: dokdo500.id,
        market: "KR",
        type: "RETAIL_PRICE",
        amount: 30000,
        nativeCurrency: "KRW",
        sourceKey: "brand:round-lab",
        sourceDisplayName: "Round Lab Korea",
        sourceUrl: "https://roundlab.co.kr/product/1025-%EB%8F%85%EB%8F%84-%ED%86%A0%EB%84%88-%EB%8C%80%EC%9A%A9%EB%9F%89-500ml/14/category/50/display/1/",
        observedAt: verifiedAt,
        verifiedAt,
      },
      {
        productVariantId: anessaNb40.id,
        market: "JP",
        type: "REFERENCE_PRICE",
        amount: 1496,
        nativeCurrency: "JPY",
        sourceKey: "brand:shiseido",
        sourceDisplayName: "ANESSA / Shiseido",
        sourceUrl: "https://www.shiseido.co.jp/anessa/products/suncare/daily-uv-gel-moisture/",
        observedAt: verifiedAt,
        verifiedAt,
      },
      {
        productVariantId: anessaNb90.id,
        market: "JP",
        type: "REFERENCE_PRICE",
        amount: 2508,
        nativeCurrency: "JPY",
        sourceKey: "brand:shiseido",
        sourceDisplayName: "ANESSA / Shiseido",
        sourceUrl: "https://www.shiseido.co.jp/anessa/products/suncare/daily-uv-gel-moisture/",
        observedAt: verifiedAt,
        verifiedAt,
      },
    ],
  });

  await prisma.externalSignal.deleteMany({
    where: {
      OR: [
        {
          productVersionId: dokdoVersion.id,
          sourceKey: { in: ["retailer:shoppers-drug-mart-ca", "retailer:olive-young-kr"] },
        },
        {
          productVersionId: anessaNb.id,
          sourceKey: "platform:atcosme",
        },
      ],
    },
  });

  await prisma.externalSignal.createMany({
    data: [
      {
        productVersionId: dokdoVersion.id,
        sourceKey: "retailer:shoppers-drug-mart-ca",
        sourceDisplayName: "Shoppers Drug Mart",
        sourceUrl: "https://www.shoppersdrugmart.ca/round-lab-1025-dokdo-toner/p/BB_8809657114731?variantCode=8809657114731",
        rating: 4.9,
        ratingScale: 5,
        reviewCount: 261,
        verifiedAt,
      },
      {
        productVersionId: dokdoVersion.id,
        sourceKey: "retailer:olive-young-kr",
        sourceDisplayName: "Olive Young",
        sourceUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000125507",
        rankingLabel: "No. 1 toner",
        verifiedAt,
      },
      {
        productVersionId: anessaNb.id,
        sourceKey: "platform:atcosme",
        sourceDisplayName: "@cosme",
        sourceUrl: "https://www.cosme.net/products/10288945/",
        rating: 5.2,
        ratingScale: 7,
        reviewCount: 2613,
        rankingLabel: "No. 1 makeup primer",
        verifiedAt,
      },
    ],
  });

  await prisma.offerItem.deleteMany({ where: { offerId: dokdoWellOffer.id } });

  console.log("Seeded canonical taxonomy, 2 brands, 2 product families, 3 versions, 5 variants, and demo price observations.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
