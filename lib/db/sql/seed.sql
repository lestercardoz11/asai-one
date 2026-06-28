-- Re-seed the signed-off catalogue into the normalized schema. Preserves the
-- existing UUIDs (products/variants/categories/images/inventory/coupons) so
-- default_variant_id and FK links stay intact. The old attribute-based variants
-- are expanded into product_options / product_option_values / variant_option_values
-- with display strings matching the former formatAxisValue() output.

/* ── Categories ────────────────────────────────────────────────────────────── */
insert into public.categories (id, slug, name, description, status, sort_order, icon, tagline, meta_title, meta_description) values
('5cd9c563-4b88-4db6-87bc-a989f54fa7c3','2-wheeler','2-Wheeler','Essentials engineered for life on two wheels — sweat, weather, grime and the everyday grind of the commute, handled.','active',1,'two-wheeler','Built for the daily ride','Two-Wheeler Essentials | ASAI.One','Helmet upgrades, ride accessories and protective gear built for two-wheeler commuters.'),
('e62a1ece-d5bd-4d24-86cb-3b8ee81db9ff','4-wheeler','4-Wheeler','Cabin care, organisation and comfort for the four-wheel commute. Landing soon.','coming_soon',2,'four-wheeler','In development','Four-Wheeler Essentials | ASAI.One','In-car organisers, comfort gear and travel kits for daily drivers. Coming soon.'),
('eff54da9-5105-4595-93b4-5485e120660c','pedestrian','Pedestrian','Carry-light essentials for the walk-and-transit commuter. Landing soon.','coming_soon',3,'pedestrian','In development','Pedestrian Essentials | ASAI.One','Hi-viz, weather-ready and compact gear for the daily walking commute. Coming soon.'),
('e9306a8c-ea09-4b6c-b49f-95c0179c5bed','public-transport','Public Transport','Compact, commute-ready kit for buses, trains and the metro. Landing soon.','coming_soon',4,'public-transport','In development','Public Transport Essentials | ASAI.One','Compact, secure, and stash-friendly gear for the daily metro/train/bus rider. Coming soon.');

/* ── Products ──────────────────────────────────────────────────────────────── */
insert into public.products
  (id, category_id, slug, sku, name, short_description, description, price_paise, original_price_paise,
   tags, specs, features, compatibility, is_returnable, return_window_days, is_active, is_new, is_featured,
   rating, review_count, weight_grams, hsn_code, shipping_policy, default_variant_id)
values
('99b6d555-f9b6-4cd8-a9f1-4b667146e062','5cd9c563-4b88-4db6-87bc-a989f54fa7c3','asai-absrb','ASAI-ABSRB-01','ASAI Absrb',
 'Sweat-wicking helmet liner pads. Stick, ride, swap — a fresh helmet every day.',
 $d$Absrb is a thin, high-loft pad that lines the brow and crown of your helmet, drawing sweat off your skin before it stings your eyes or sours the foam. Each pad is good for a week of commuting, then you peel and replace — no washing, no drying, no helmet funk. Sized to fit every full-face and open-face shell.$d$,
 29900,null,
 ARRAY['liner','hygiene','monsoon'],
 $j$[{"label":"Material","value":"Micro-perforated PU + cotton loft"},{"label":"Thickness","value":"3 mm"},{"label":"Use","value":"~7 commute days / pad"},{"label":"Made in","value":"Pune, India"}]$j$::jsonb,
 ARRAY['Wicks sweat away from the brow in seconds','One week of riding per pad','Peel-and-replace — no washing','Universal fit for full-face & open-face'],
 'Universal — fits most full-face and open-face helmets',false,0,true,false,true,4.6,213,90,'6505','Ships in 24h · Free over ₹499','c33d3312-4b2b-464c-980d-e77fada804ab'),
('2368ebe6-fb8a-4104-beeb-8844c8aed0be','5cd9c563-4b88-4db6-87bc-a989f54fa7c3','asai-childlock','ASAI-CHLD-01','ASAI ChildLock',
 'Pillion safety harness that keeps your child anchored to you, not the grab-rail.',
 $d$ChildLock is a padded harness that loops around the rider and secures your child to your back, so a tired grip or a sudden brake never becomes a fall. The buckle is one-hand operable with gloves on, the strap is reflective for low light, and the whole thing folds into a jacket pocket when you're riding solo.$d$,
 89900,null,
 ARRAY['safety','family','flagship'],
 $j$[{"label":"Fits","value":"Child 2–7 yrs · up to 30 kg"},{"label":"Webbing","value":"Aramid-reinforced nylon"},{"label":"Buckle","value":"Dual-release safety clasp"},{"label":"Made in","value":"Pune, India"}]$j$::jsonb,
 ARRAY['Anchors child to rider, not the grab-rail','One-hand glove-friendly buckle','Reflective strap for low light','Folds into a jacket pocket'],
 'Universal — fits any adult rider, ages 3–10 pillion',true,7,true,false,true,4.8,167,480,'6307','Ships in 24h · Free over ₹499','574ba68f-0c84-405b-8023-b9e65717a2f9'),
('9a0bfff5-d2ad-4640-811f-29bc2590ee63','5cd9c563-4b88-4db6-87bc-a989f54fa7c3','asai-drylock-pods','ASAI-DRYP-01','ASAI DryLock Pods',
 'Rechargeable moisture pods that keep helmets, gloves and gear boxes bone-dry.',
 $d$Toss a DryLock pod into your helmet, top-box or glove and it pulls the damp out overnight — no more clammy foam or that wet-dog smell after the monsoon ride home. When the indicator window turns pink, microwave or sun-dry the pod and it's good as new. Pick the size for the space and the pack for how many corners of your kit need drying.$d$,
 14900,null,
 ARRAY['monsoon','rain','modular'],
 $j$[{"label":"Recharge","value":"Microwave or sun-dry"},{"label":"Lifespan","value":"2+ years"},{"label":"Indicator","value":"Blue → pink moisture window"},{"label":"Made in","value":"Pune, India"}]$j$::jsonb,
 ARRAY['Pulls moisture from helmets, gloves & top-boxes','Colour window shows when to recharge','Reusable for 2+ years','Fragrance-free, non-toxic silica'],
 'Universal — fits most modern vented helmets',false,0,true,true,false,4.5,301,50,'6506','Ships in 24h · Free over ₹499','d950dbd2-c4d6-4562-8e27-05bcd21c1ea5'),
('12569d17-149c-49c1-a765-680ad28ec280','5cd9c563-4b88-4db6-87bc-a989f54fa7c3','asai-pureride','ASAI-PURE-01','ASAI PureRide',
 'Anti-pollution riding mask that filters the road without fogging your visor.',
 $d$PureRide seals against your face and filters the exhaust, dust and particulate you'd otherwise breathe for an hour a day. The exhale valve vents heat and moisture so your visor stays clear at the signal, and the contoured shell sits flush under any helmet. Advance adds an active carbon layer for heavier traffic corridors.$d$,
 129900,null,
 ARRAY['health','pollution','replaceable'],
 $j$[{"label":"Filtration","value":"Basic: PM2.5 · Advance: PM2.5 + carbon"},{"label":"Valve","value":"One-way anti-fog exhale"},{"label":"Filter life","value":"~40 commute hours"},{"label":"Made in","value":"Pune, India"}]$j$::jsonb,
 ARRAY['Filters exhaust, dust & particulate','Anti-fog exhale valve keeps visors clear','Contoured to sit under any helmet','Washable shell, replaceable filters'],
 'Universal — most full-face visors',false,0,true,true,false,4.4,129,30,'6307','Ships in 48h · Free over ₹499','755a7563-60c4-4765-9e36-3c1d05d90fbd'),
('bd068b8e-ecb6-457d-ace4-2e4b58854ef7','5cd9c563-4b88-4db6-87bc-a989f54fa7c3','asai-shield','ASAI-SHLD-01','ASAI Shield',
 'All-weather reflective riding shell that packs down to the size of your fist.',
 $d$Shield is the layer you keep stuffed under the seat for the ride that turns on you — windproof, water-repellent and lit up with reflective piping for the dark commute home. Basic blocks wind and light rain; Advance adds a taped-seam membrane and a thermal liner for the cold, wet months. Packs into its own chest pocket.$d$,
 179900,null,
 ARRAY['safety','flagship','protection'],
 $j$[{"label":"Shell","value":"Ripstop nylon, DWR-treated"},{"label":"Reflectivity","value":"360° piping + rear panel"},{"label":"Packed size","value":"~14 cm pouch"},{"label":"Made in","value":"Pune, India"}]$j$::jsonb,
 ARRAY['Windproof & water-repellent shell','Reflective piping for the night ride','Packs into its own chest pocket','Advance: taped seams + thermal liner'],
 'Wears under any jacket — S / M / L / XL',true,7,true,false,false,4.7,98,320,'6307','Ships in 48h · Free over ₹499','acc1a0e4-9005-4014-8770-191f82548d4d');

/* ── Options + values (axes → normalized) ──────────────────────────────────── */
insert into public.product_options (id, product_id, name, position) values
('a0000000-0000-4000-8000-000000000001','99b6d555-f9b6-4cd8-a9f1-4b667146e062','Pack size',0),
('a0000000-0000-4000-8000-000000000002','9a0bfff5-d2ad-4640-811f-29bc2590ee63','Size',0),
('a0000000-0000-4000-8000-000000000003','9a0bfff5-d2ad-4640-811f-29bc2590ee63','Pack',1),
('a0000000-0000-4000-8000-000000000004','12569d17-149c-49c1-a765-680ad28ec280','Tier',0),
('a0000000-0000-4000-8000-000000000005','bd068b8e-ecb6-457d-ace4-2e4b58854ef7','Tier',0);

insert into public.product_option_values (id, option_id, value, position) values
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Pack of 6',0),
('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','Pack of 12',1),
('b0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000002','75g',0),
('b0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000002','150g',1),
('b0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000002','300g',2),
('b0000000-0000-4000-8000-000000000020','a0000000-0000-4000-8000-000000000003','Single',0),
('b0000000-0000-4000-8000-000000000021','a0000000-0000-4000-8000-000000000003','Pack of 3',1),
('b0000000-0000-4000-8000-000000000030','a0000000-0000-4000-8000-000000000004','Basic',0),
('b0000000-0000-4000-8000-000000000031','a0000000-0000-4000-8000-000000000004','Advance',1),
('b0000000-0000-4000-8000-000000000040','a0000000-0000-4000-8000-000000000005','Basic',0),
('b0000000-0000-4000-8000-000000000041','a0000000-0000-4000-8000-000000000005','Advance',1);

/* ── Variants ──────────────────────────────────────────────────────────────── */
insert into public.product_variants (id, product_id, sku, variant_name, price_paise, original_price_paise, weight_grams, position, is_active) values
('c33d3312-4b2b-464c-980d-e77fada804ab','99b6d555-f9b6-4cd8-a9f1-4b667146e062','ABS-PK6','Pack of 6',29900,null,null,0,true),
('23d4237c-d5a1-4ec2-ab98-6820920192f3','99b6d555-f9b6-4cd8-a9f1-4b667146e062','ABS-PK12','Pack of 12',54900,59800,null,1,true),
('574ba68f-0c84-405b-8023-b9e65717a2f9','2368ebe6-fb8a-4104-beeb-8844c8aed0be','CHL-STD','Standard',89900,109900,null,0,true),
('cd11437c-e799-4d43-b936-c46c1eb323f3','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-75-1','75g · Single',14900,null,75,0,true),
('96b97c57-eb0a-43b5-a149-2d19c5aeab7a','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-75-3','75g · Pack of 3',39900,44700,75,1,true),
('d950dbd2-c4d6-4562-8e27-05bcd21c1ea5','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-150-1','150g · Single',24900,null,150,2,true),
('86a9e865-8b08-495d-aaca-04ca9166119f','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-150-3','150g · Pack of 3',64900,74700,150,3,true),
('ab82335e-d9b8-42a5-9bc0-d965a5e6e38c','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-300-1','300g · Single',44900,null,300,4,true),
('e7469a58-5f88-4ad5-84d7-b40f7cd5b704','9a0bfff5-d2ad-4640-811f-29bc2590ee63','DRY-300-3','300g · Pack of 3',114900,134700,300,5,true),
('755a7563-60c4-4765-9e36-3c1d05d90fbd','12569d17-149c-49c1-a765-680ad28ec280','PUR-BAS','Basic',129900,null,null,0,true),
('c82866c8-4a8d-41db-b6b2-e7da2db4605c','12569d17-149c-49c1-a765-680ad28ec280','PUR-ADV','Advance',199900,null,null,1,true),
('acc1a0e4-9005-4014-8770-191f82548d4d','bd068b8e-ecb6-457d-ace4-2e4b58854ef7','SHD-BAS','Basic',179900,null,null,0,true),
('52201702-3901-40f8-937a-d7ff07fdfd05','bd068b8e-ecb6-457d-ace4-2e4b58854ef7','SHD-ADV','Advance',279900,299900,null,1,true);

/* ── Variant ↔ option-value junction ───────────────────────────────────────── */
insert into public.variant_option_values (variant_id, option_value_id) values
('c33d3312-4b2b-464c-980d-e77fada804ab','b0000000-0000-4000-8000-000000000001'),
('23d4237c-d5a1-4ec2-ab98-6820920192f3','b0000000-0000-4000-8000-000000000002'),
('cd11437c-e799-4d43-b936-c46c1eb323f3','b0000000-0000-4000-8000-000000000010'),
('cd11437c-e799-4d43-b936-c46c1eb323f3','b0000000-0000-4000-8000-000000000020'),
('96b97c57-eb0a-43b5-a149-2d19c5aeab7a','b0000000-0000-4000-8000-000000000010'),
('96b97c57-eb0a-43b5-a149-2d19c5aeab7a','b0000000-0000-4000-8000-000000000021'),
('d950dbd2-c4d6-4562-8e27-05bcd21c1ea5','b0000000-0000-4000-8000-000000000011'),
('d950dbd2-c4d6-4562-8e27-05bcd21c1ea5','b0000000-0000-4000-8000-000000000020'),
('86a9e865-8b08-495d-aaca-04ca9166119f','b0000000-0000-4000-8000-000000000011'),
('86a9e865-8b08-495d-aaca-04ca9166119f','b0000000-0000-4000-8000-000000000021'),
('ab82335e-d9b8-42a5-9bc0-d965a5e6e38c','b0000000-0000-4000-8000-000000000012'),
('ab82335e-d9b8-42a5-9bc0-d965a5e6e38c','b0000000-0000-4000-8000-000000000020'),
('e7469a58-5f88-4ad5-84d7-b40f7cd5b704','b0000000-0000-4000-8000-000000000012'),
('e7469a58-5f88-4ad5-84d7-b40f7cd5b704','b0000000-0000-4000-8000-000000000021'),
('755a7563-60c4-4765-9e36-3c1d05d90fbd','b0000000-0000-4000-8000-000000000030'),
('c82866c8-4a8d-41db-b6b2-e7da2db4605c','b0000000-0000-4000-8000-000000000031'),
('acc1a0e4-9005-4014-8770-191f82548d4d','b0000000-0000-4000-8000-000000000040'),
('52201702-3901-40f8-937a-d7ff07fdfd05','b0000000-0000-4000-8000-000000000041');

/* ── Images ────────────────────────────────────────────────────────────────── */
insert into public.product_images (id, product_id, variant_id, url, alt, position, is_primary) values
('e207f898-deb9-492d-b6bf-e4db7de73902','99b6d555-f9b6-4cd8-a9f1-4b667146e062',null,'/images/asai-absrd.webp','ASAI Absrb',0,true),
('500392ba-f077-4f09-9b14-6f72f29c32e1','2368ebe6-fb8a-4104-beeb-8844c8aed0be',null,'/images/asai-childlock-1.webp','ASAI ChildLock',0,true),
('fb13541a-18b3-49a3-adeb-395fe47546e3','2368ebe6-fb8a-4104-beeb-8844c8aed0be',null,'/images/asai-childlock-2.webp','ASAI ChildLock',1,false),
('89ac5996-e3de-4103-afa0-5465b624e8a3','2368ebe6-fb8a-4104-beeb-8844c8aed0be',null,'/images/asai-childlock-3.webp','ASAI ChildLock',2,false),
('2d4bc6be-b279-4b44-887f-71d56d723e23','9a0bfff5-d2ad-4640-811f-29bc2590ee63',null,'/images/asai-drylock-pods.webp','ASAI DryLock Pods',0,true),
('3a0c8a4e-8054-4933-92c7-6919b1cc2d95','12569d17-149c-49c1-a765-680ad28ec280',null,'/images/asai-pureride-1.webp','ASAI PureRide',0,true),
('3751f9ab-1f6e-47d3-8cb6-edd0e9f671a4','12569d17-149c-49c1-a765-680ad28ec280',null,'/images/asai-pureride-2.webp','ASAI PureRide',1,false),
('81a2a0ba-ae0d-4597-888f-8551b0dc5e23','bd068b8e-ecb6-457d-ace4-2e4b58854ef7',null,'/images/asai-shield.webp','ASAI Shield',0,true);

/* ── Inventory ─────────────────────────────────────────────────────────────── */
insert into public.inventory (id, product_id, variant_id, quantity, reserved, low_stock_threshold, warehouse_code) values
('778765c6-7862-42be-b69f-0a61c56c585c','99b6d555-f9b6-4cd8-a9f1-4b667146e062','c33d3312-4b2b-464c-980d-e77fada804ab',142,0,5,'MUM-1'),
('412496aa-db7c-4212-990f-6497815fb476','99b6d555-f9b6-4cd8-a9f1-4b667146e062','23d4237c-d5a1-4ec2-ab98-6820920192f3',88,0,5,'MUM-1'),
('abada0da-5138-4335-8d45-0f2e28dba4a0','2368ebe6-fb8a-4104-beeb-8844c8aed0be','574ba68f-0c84-405b-8023-b9e65717a2f9',54,0,5,'MUM-1'),
('8ac92287-5fc8-449b-be35-3b47b6b62412','9a0bfff5-d2ad-4640-811f-29bc2590ee63','cd11437c-e799-4d43-b936-c46c1eb323f3',210,0,5,'MUM-1'),
('8f9b74e8-ff6b-41e6-9207-655ec5e6c48c','9a0bfff5-d2ad-4640-811f-29bc2590ee63','96b97c57-eb0a-43b5-a149-2d19c5aeab7a',120,0,5,'MUM-1'),
('e012e8f2-f714-42f4-b790-bcd75b1aa53d','9a0bfff5-d2ad-4640-811f-29bc2590ee63','d950dbd2-c4d6-4562-8e27-05bcd21c1ea5',175,0,5,'MUM-1'),
('28ade388-d317-4b1f-9c34-9f44a9cc59cc','9a0bfff5-d2ad-4640-811f-29bc2590ee63','86a9e865-8b08-495d-aaca-04ca9166119f',96,0,5,'MUM-1'),
('da537e54-0366-4a7f-aba1-d59604038382','9a0bfff5-d2ad-4640-811f-29bc2590ee63','ab82335e-d9b8-42a5-9bc0-d965a5e6e38c',64,0,5,'MUM-1'),
('6c06312b-a00f-4245-aad4-a5ae9fee8515','9a0bfff5-d2ad-4640-811f-29bc2590ee63','e7469a58-5f88-4ad5-84d7-b40f7cd5b704',38,0,5,'MUM-1'),
('17cf37bf-ca2b-4ed9-9464-0e1feae0a031','12569d17-149c-49c1-a765-680ad28ec280','755a7563-60c4-4765-9e36-3c1d05d90fbd',73,0,5,'MUM-1'),
('c1e00b13-c484-4128-a226-d13f0af21fe5','12569d17-149c-49c1-a765-680ad28ec280','c82866c8-4a8d-41db-b6b2-e7da2db4605c',41,0,5,'MUM-1'),
('2909d125-938f-4fde-a668-ba6277ae983a','bd068b8e-ecb6-457d-ace4-2e4b58854ef7','acc1a0e4-9005-4014-8770-191f82548d4d',60,0,5,'MUM-1'),
('34a7ea58-7de8-49f2-9e29-292c41c841ab','bd068b8e-ecb6-457d-ace4-2e4b58854ef7','52201702-3901-40f8-937a-d7ff07fdfd05',29,0,5,'MUM-1');

/* ── Coupons ───────────────────────────────────────────────────────────────── */
insert into public.coupons (id, code, description, type, value_paise, percent_off, min_subtotal_paise, max_discount_paise, is_active) values
('55a94881-5d46-42b9-bbce-f329434bf40e','RIDE10','10% off your order','percent',null,10,0,null,true),
('08e5c672-6cda-41ca-82c7-a6653382d6a4','FREESHIP','Free shipping','free_shipping',null,null,29900,null,true),
('a11e1812-bf99-487d-87ab-fe3fd81478ff','ASAI150','₹150 off orders over ₹999','fixed_amount',15000,null,99900,null,true);

-- Ratings & review counts start at 0 — they are maintained only by real approved
-- reviews (tg_reviews_maintain_rating). No fabricated social proof on the store.
update public.products set rating = 0, review_count = 0;
