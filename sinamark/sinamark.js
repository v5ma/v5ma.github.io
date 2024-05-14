//<br><a href="#" class="inner-link" data-target="about">Learn more about us</a>
document.addEventListener("DOMContentLoaded", function() {
    // 1. Variable Initialization
    const containers = document.querySelectorAll('.container');
    const navLinks = document.querySelectorAll('.nav a');
    const langToggle = document.querySelector('.language-toggle');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const pageTitle = document.getElementById('pageTitle');
    const headerTitle = document.getElementById('headerTitle');
  
    const body = document.body;
    

    // 2. Language-specific Page Titles
    const pageTitles = {
        "English": "SINAMARK® - Excellent Dragon Mark",
        "Traditional Chinese": "SINAMARK® - 卓越龍標"
    };

     // 3. Navigation Menu Translations
    const menuTranslations = {
        "English": {
            "welcome": "Welcome",
            "about": "About Us",
            "products": "Products",
            "checkout": "Checkout",
            "faq": "FAQ",
            "blog": "Blog",
            "darkMode": "Dark Mode",
            "lightMode": "Light Mode",
            "language": "中文",
            "silk100": "Silk100",
            "sinasilk": "Sinasilk",
            "sinachar": "Sinachar",
            "testimonials": "Testimonials" // New Testimonials tab
        },
        "Traditional Chinese": {
            "welcome": "欢迎",
            "about": "關於我們",
            "products": "產品",
            "checkout": "結帳",
            "faq": "常見問題",
            "blog": "博客",
            "darkMode": "暗模式",
            "lightMode": "亮模式",
            "language": "English",
            "silk100": "Silk100",
            "sinasilk": "Sinasilk",
            "sinachar": "Sinachar",
            "testimonials": "推荐书" // New Testimonials tab
        }
    };

    // 4. Content Translations
    const contentTranslations = {
        "English": {
          "welcome": {
              "title": "",
              "content": `
                  <iframe width="100%" height="auto" src="https://www.youtube.com/embed/S_nZr3vr4ds?si=740dNtF3UbI3-CaF" 
                  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen></iframe>
                  <div>
                  <h1>Welcome to SINAMARK</h1>
                  <p>
                    SINAMARK is the purveyor of 100% compostable silk dental floss, and biodegradable bamboo charcoal dental floss, without any harmful chemical additives, in reusable and recyclable containers.
                  </p>
                  <p>
                    SINAMARK’s Chinese name 卓越龍牌 means “Excellent Dragon Mark.” Excellence is more than just external quality. It includes internal qualities that may not be visible to the naked eye. Excellence is our CORE VALUE!
                  </p>
                  <h2>Why Silk Floss?</h2>
                  <p>
                    Silk was the original dental floss, until WWII when plastic was substituted as a cheaper alternative. Although silk feels luxurious, silk dental floss is not a luxury. SINAMARK uses only 100% natural silk because silk is the strongest natural thread known to man, yet it is 100% compostable.
                  </p>
                  <h2>Why Bamboo Charcoal?</h2>
                  <p>
                    Bamboo is a fast-growing grass, and is therefore sustainable. The microscopic structure of bamboo charcoal enables it to absorb bacteria.
                  </p>
                  <h2>Why Support The Circular Economy</h2>
                  <p>
                    When we DISPOSE, there is never enough for anyone! But when we REUSE, there is enough for everyone! Start a Healthy Habit!
                  </p>
                </div>
                  <h2>Our Commitments</h2>
                    <ul>
                      <li>Promoting the circular economy!</li>
                      <li>Our mission is to create a Reuse & Reusability Revolution.</li>
                      <li>Good oral health</li>
                      <li>Preserving a traditional way of life for silk and bamboo farmers</li>
                      <li>Excellence in reusable oral care products</li>
                      
                      
                    </ul>
                    
                <a href="#" class="inner-link" data-target="about">Learn more about us and why you should choose the Sinamark brand</a>
              `
          },
            "about": {
                "title": "",
                "content": `
                    <h1>About SINAMARK</h1>
                    <p>SINAMARK’s VISION is to promote a circular economy, support 5000+ years of Chinese silk and bamboo culture, champion good dental health, and reduce plastic waste that enters landfills and oceans.</p>
                    <p>SINAMARK’s MISSION is to spark a reusable renaissance by offering quality compostable products in reusable containers for a healthier life and a healthier planet.</p>
                    <p>In 1915, Tong Bong started SING FAT Oriental Bazaar after the Great 1906 Earthquake in San Francisco. SING FAT’s flagship store became the symbol of SF Chinatown’s rebirth, and the Chinese people’s resolve to remain in the USA after the US government passed the Chinese Exclusion Act of 1882. One century later, his great grandson conceived SINAMARK.</p>
                    <p>SINAMARK’s Chinese name 卓越龍牌 means “Excellent Dragon Mark” which continues the legacy of SING FAT’s “Dragon Mark. The characters for “Excellence” were added, and placed 1st because it is our CORE VALUE! Excellence is more than just external quality. It includes internal qualities that may not be visible to the naked eye.</p>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/SING%20FAT%20CO.png?v=1715649417837"
                            crossorigin="anonymous" alt=""
                            class="product-image constrained-image"
                          />
                        </div>
                `
            },
            "products": {
                "title": "Our Products",
                "content": `
                        <a href="#" class="inner-link" data-target="silk100"><h2>Silk100</h2></a>
                        <p>100% silk floss for gentle and effective cleaning. Biodegradable and compostable.</p>
                        <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/silk100.JPG?v=1715570328643"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                        
                        <div class="product">
                        <a href="#" class="inner-link" data-target="sinasilk"><h2>Sinasilk</h2></a>
                        <p>Premium silk floss designed for optimal dental health and environmental sustainability.</p>
                        <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                        
                        
                        <div class="product">
                        
                        <a href="#" class="inner-link" data-target="sinachar"><h2>Sinachar</h2></a>
                        <p>Bamboo charcoal floss, combining deep cleaning with a commitment to sustainability.</p>
                        <ul>
                        
                        </ul>
                        <a href="#" class="inner-link" data-target="sinachar">Learn more about Sinachar</a>
                        </div>
                        <p><strong>Start a Healthy Habit Floss with Sinasilk and Sinachar!</strong></p>
                `
            },
            "checkout": {
                "title": "Checkout",
                "content": `
                    <div>
                      <h1>How to Purchase</h1>
                      <h2>Ordering</h2>
                      <ol>
                        <li>To place an order, simply enter your name and email address in the provided form.</li>
                        <li>Our team will send you a secure payment link via email to complete your purchase.</li>
                      </ol>
                      <form id="checkoutForm">
                        <label for="firstName">First Name:</label>
                        <input type="text" id="firstName" name="firstName" required>
                        <br>
                        <label for="lastName">Last Name:</label>
                        <input type="text" id="lastName" name="lastName" required>
                        <br>
                        <label for="email">Email Address:</label>
                        <input type="email" id="email" name="email" required>
                        <br>
                        <button type="button" onclick="submitForm()">Submit</button>
                      </form>

                      <h2>Secure Payment Processing</h2>
                      <ul>
                        <li>We use Stripe, a trusted and secure payment gateway, to process all transactions.</li>
                        <li>Click on the payment link in your email to complete your purchase.</li>
                        <li>Your payment information is kept confidential and secure.</li>
                      </ul>
                      <h2>Order Summary</h2>
                      <ul>
                        <li>Before finalizing your purchase, review the clear breakdown of products and prices.</li>
                        <li>The total will include the subtotal, tax, and shipping costs.</li>
                      </ul>
                      <h2>Complete Your Purchase</h2>
                      <ol>
                        <li>After reviewing your order details, click the "Pay Now" button in the email to finalize your purchase.</li>
                        <li>You will be redirected to a secure Stripe payment page to enter your payment information.</li>
                        <li>Once your payment is processed, you will receive a confirmation email with your order details.</li>
                      </ol>
                      <h2>Returns and Refunds</h2>
                      <p>
                        Please note that this dental hygiene product cannot be returned for sanitary reasons. If the dental floss does not work for you, consider its many non-dental uses:
                      </p>
                      <ul>
                        <li>Silk dental floss is stronger than regular thread and makes a superior emergency sewing kit. Just add a carpet needle to the bottle.</li>
                      </ul>
                      <p>
                        If you have any issues with your purchase, please contact our customer support team. Please be aware that if multiple refunds are requested, your request will be reviewed on a case by case basis.
                      </p>
                    </div>
                `
            },
            "faq": {
                "title": "Frequently Asked Questions (FAQ)",
                "content": `
                    <h2>FAQ</h2>
                    <div>
                      <h3>How do I use dental floss?</h3>
                      <p>
                        When you floss, dentists recommend wrapping the string around each tooth, and moving the floss perpendicular to its length, and away from the gums (downward on upper teeth, or upward on lower teeth). Flossing too roughly with any dental floss can damage your gums, or even cause gingival clefts. Never 'saw' at the base of the tooth like a lumberjack sawing a log - that's just cutting into the gum. Also, avoid 'snapping' the floss between teeth, which puts pressure on your gums and can cause them to recede.
                      </p>
                      <p>
                        If you suffer from a cut, rinse your mouth with salt water or an antiseptic rinse. Apply pressure to the area and ice. This will help stop the bleeding and help with any pain. If you continue to bleed, consult with your dental professional.
                      </p>
                    </div>

                    <div>
                      <h3>Where is SINASILK™ manufactured?</h3>
                      <p>In China – where silk manufacture was invented 5000 years ago!</p>
                    </div>

                    <div>
                      <h3>When was silk first used as dental floss?</h3>
                      <p>
                        <strong>Prehistory:</strong> The exact date of the first use of dental floss is unknown but researchers found evidence that floss existed in prehistoric times. Grooves from floss and toothpicks have been found in the mouths of prehistoric humans. It is suggested that horse hair was used as floss and twigs were used as toothpicks to dislodge anything from the teeth.
                      </p>
                      <p>
                        <strong>1815:</strong> American dentist, Dr. Levi Spear Parmly introduces the idea of using waxed silk thread as floss. Later in his career, he published a book, A Practical Guide to the Management of Teeth, which emphasized the importance of brushing and flossing daily.
                      </p>
                      <p>
                        <strong>1940s:</strong> Due to rising costs of silk during World War II, nylon replaces silk as the main material in floss.
                      </p>
                    </div>

                    <div>
                      <h3>Which is the best floss – Bamboo, Charcoal, Corn, or Silk?</h3>
                      <p>
                        First of all, charcoal can be made from any organic matter. Secondly, the description "Bamboo Charcoal Floss" is very misleading. Bamboo charcoal is not the thread itself – charcoal derived from burning bamboo is infused into the thread. Thirdly, the thread is made of polyester or nylon – a petroleum-based plastic which is not compostable. Plastic can be bio-based, but chemically is still a plastic. Since silk floss is never infused with charcoal, the best material for infusion is polyester thread. Corn PLA (PolyLactic Acid, a bio-based plastic) is 100% compostable, but is significantly weaker than either silk or polyester.
                      </p>
                      <p>
                        <strong>BOTTOM LINE</strong>
                        <br />
                        Silk is the strongest 100% compostable, 100% natural fiber dental floss!
                      </p>
                    </div>

                    <div>
                      <h3>What is Candelilla (sometimes spelled Candelilly) Wax?</h3>
                      <p>
                        Candelilla Wax (CW) is a wax obtained from the leaves of a small shrub native to northern Mexico and the southwestern United States, Euphorbia cerifera and Euphorbia antisyphilitica, from the family Euphorbiaceae. Candelilla wax is non-toxic and food-safe. It has been approved for use in food products by the Food and Drug Administration (FDA). The FDA also regulates cosmetics and has approved candelilla for use in beauty products as well.
                      </p>
                    </div>

                    <div>
                      <h3>What does Natural mean?</h3>
                      <p>
                        NATURAL: from nature; not artificial or involving anything made or caused by people. Silk is a natural fiber!
                      </p>
                      <p>
                        If a food grade product is described as natural, it means it has no artificial chemical substances added to it – no PTFE and no PFAS!
                      </p>
                      <p>
                        <strong>SOURCE:</strong> Cambridge Dictionary
                      </p>
                    </div>

                    <div>
                      <h3>What is PTFE?</h3>
                      <p>PolyTetraFluoroEthylene – brand name Teflon®</p>
                      <p>
                        PTFE is not better or worse than Teflon® because they are one and the same thing – different only in name and nothing else.
                      </p>
                      <p>
                        <strong>SOURCE:</strong> "Dental flossing and other behaviors linked to higher levels of PFAS in the body." Silentspring.org
                      </p>
                    </div>

                    <div>
                      <h3>What is PFAS?</h3>
                      <p>PolyFluoroAlkyl Substances</p>
                      <p>
                        <strong>SOURCE:</strong> EPA, "Human Health & Environmental Risks"
                      </p>
                    </div>

                    <div>
                      <h3>What is the difference between Compostable, Recyclable, and Biodegradable?</h3>
                      <div>
                        <h4>COMPOSTABLE</h4>
                        <p>
                          Composting is a way to turn items made of natural materials back into a nutrient rich soil. Often times the compost is for food scraps, but other items that are fully compostable include yard scraps, dead flowers, items made of untreated wood, and those made of pure cotton. While starting with food scraps is the easiest, the more you look around the more you will find items for other parts of your life that are completely compostable.
                        </p>
                        <p>
                          Compostable items are great because instead of going to landfill or needing to be processed and turned into something else, they actually breakdown themselves in a natural setting (or in an industrial facility) to create something useful right away.
                        </p>
                        <p>
                          But, what happens if you have items that are compostable but don't have access to composting. Side note: you can create a compost bin in your own backyard (or under your sink). We know that isn't for everyone though. So, what happens if these items end up in just in your standard trash bin? You might think that it's still an improvement and they will break down, right? Sorry to be the bearer of bad news, but that's not exactly the case. Compostable items break down into nutrient rich soil only if they have the right conditions. And a traditional landfill is not a place with the right conditions.
                        </p>
                        <p>
                          Industrial facilities have the optimal conditions for composting. These facilities regulate temperature, moisture, and air flow in order to ensure a compostable item breaks down as fast as possible. At-home compost is more prone to temperature/moisture/air flow changes and might not break down as quickly as it would in an industrial setting.
                        </p>
                        <p>
                          Composting works best when the items have access to oxygen and are regularly being turned over. A landfill is basically the opposite. It's an anaerobic environment where most of the pile actually doesn't have access to oxygen. That means that if your compostable takeout container ends up in the landfill, it won't break down as intended. Instead, it will mostly likely just act like a plastic container and stay around for a lot longer than intended.
                        </p>
                        <p>
                          So, while recognizing compostable items is a good first step, purchasing and using compostable items in place of other items has the biggest impact when they actually end up in a compost pile. Although, we do want to mention that the production of plastic is pretty nasty for a lot of reasons, so opting for compostable items made of cotton, bamboo, and even PLA (Poly
                           Lactic Acid – that vegetable based plastic cup and container you see at restaurants), is probably still better for the environment and your health.
                       </p>
                     </div>

                     <div>
                       <h4>RECYCLABLE</h4>
                       <p>
                         Recycling is the process of taking a product and breaking it down to use it again, often as a raw material. We all know that we can recycle paper, plastic, and cans. In most places, recycling facilities can also deal with glass. All of this is great, but let's break down the concept a little bit more. Quick note, each city is slightly different and you should check exactly what can and can't be recycled in your neighborhood before you just assume you are good to go.
                       </p>
                       <p>
                         Tossing something you think or hope can be recycled into the recycling bin is often wishful or aspirational recycling. While your heart is in the right place, doing this might actually be worse than just trashing something you aren't clear on. Why? Because that one iffy thing can actually be enough to compromise a full batch of recycling, which could mean everything ends up in the landfill instead of just the one questionable item. In those situations, the best option would be to confirm before you dispose of it. And, if your neighborhood doesn't recycle it, ask your city to start accepting those items. But, in the meantime, if you don't know, don't just hope it can be recycled.
                       </p>
                       <p>
                         Back to the topic at hand, what is actually recyclable? Most plastics that hold their shape can be recycled (like water bottles, food containers, bottles for household items, etc.). In some places, they have even started being able to accept items like plastic grocery bags, shrink wrap, and plastic wrap if it is packaged correctly. Other commonly accepted items for recycling include paper, cardboard, unbroken glass and metal (including tinfoil if it's clean and in a large enough ball).
                       </p>
                       <p>
                         Some common items that need special recycling (but are in fact recyclable) include: batteries, electronics, and fabric (and clothing). Check with your waste management provider to see what can and can't be recycled in your neighborhood.
                       </p>
                     </div>

                     <div>
                       <h4>BIODEGRADABLE</h4>
                       <p>
                         The definition of biodegradable is a substance that can break down naturally without causing any harm. This is very similar to compostable, but the biggest difference is that what it breaks down to doesn't cause harm as opposed to starting with an organically occurring materials. Therefore, man-made or chemically produced items can still be considered biodegradable, while not necessarily being compostable. This is like a square being a rectangle but a rectangle not being a square. Those items that are compostable are also biodegradable, but not everything biodegradable is compostable.
                       </p>
                       <p>
                         Again, biodegradable options are still a step in the right direction. It does mean that the ingredients break down over time and when they do break down, the base components are not harmful to the environment.
                       </p>
                       <p>
                         One drawback of biodegradable materials is that there is not necessarily a time-frame for when the items will break down. It could be many years before they start to degrade. In most cases, biodegradable isn't really saying much about the product.
                       </p>
                     </div>

                     <p>
                       <strong>BOTTOM LINE</strong>
                       <br />
                       If we were to rank these terms for which ones are best for the planet and in turn our health, we'd say first look for items that are compostable, recyclable, and lastly biodegradable. Compostable items, if properly disposed of, will break down completely and can them be used to grow more resources. Recyclable items can be turned into raw materials that can then be used to make new things without needing to create completely new resources. And finally, biodegradable options will eventually break down, but we don't know when and there is no plan to use them for any additional benefit.
                     </p>
                     <p>
                       <strong>SOURCE:</strong> Center for Environmental Health
                     </p>
                   </div>
                    `
            },
            "blog": {
                "title": "SINAMARK Blog",
                "content": `
                    <h2>Featured Articles</h2>
                    <div id="substack-feed-embed"></div>
                    <script>
                      window.SubstackFeedWidget = {
                      
                        substackUrl: "sinamark.substack.com",
                        posts: 4,
                        layout: "right",
                        hidden: ["date"],
                        
                      };
                    </script>
                    <script src="https://substackapi.com/embeds/feed.js" async></script>
                    
                `
            },
            "silk100": {
                "title": "Silk100",
                "content": `
                    <a href="#" class="inner-link" data-target="products">Back to Products Page</a>
                    <p>100% Natural Silk Dental Floss</p>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                    <h2>Product Details</h2>
                    <ul>
                        <li><strong>LENGTH:</strong> 1 roll x 30 meters (33 yards)(99 feet).</li>
                        <li><strong>EFFECTIVELY REMOVES PLAQUE:</strong> Silk100 removes plaque better than plastic floss because its woven texture offers more surface area than plastic.</li>
                        <li><strong>STRONG & SILKY:</strong> Silk100 is silky smooth because it is 100% natural silk thread - arguably the strongest natural fiber known to man. Yet it is 100% compostable and can disintegrate in as little as three months. 100% silk just feels better, so you'll want to floss more, and that leads to a cleaner mouth.</li>
                        <li><strong>HEALTHY & NATURAL:</strong> Silk100 has a subtle natural mint flavor and is coated with vegan candelilla wax to facilitate handling. Contains no bleach, dyes, or other harmful additives like Teflon – a PolyTetraFluoroEthylene (PTFE), or PolyFluoroAlkyl Substances (PFAS).</li>
                        <li><strong>REUSABLE & RECYCLABLE:</strong> Silk100's high quality glass bottle is reusable, washable, compact, and recyclable. Clear see-thru glass design allows you to see when you need to replace floss. Stainless steel lids prevent rust. Double lids keep floss clean. Multi-pack refills do not include a glass bottle dispenser.</li>
                    </ul>
                    <h2>Refills & Subscriptions</h2>
                    <p>Convenient 4-pack refills for Silk100 floss. Same high-quality silk floss as the original product.</p>
                    <ul>
                        <li>1x refill every 3 months</li>
                        <li>2x refills every 6 months</li>
                        <li>3x refills every 9 months</li>
                        <li>4x refills every 12 months</li>
                    </ul>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/refill.JPG?v=1715570338692"
                            crossorigin="anonymous" alt="Silk100 Dental Floss Refills"
                            class="product-image constrained-image"
                          />
                    </div>
                    <a href="#" class="inner-link" data-target="checkout"><h2>Request Order Form</h2></a>  
                `
            },
            "sinasilk": {
                "title": "",
                "content": `
                    <a href="#" class="inner-link" data-target="products">Back to Products Page</a>
                    <h2>Sinasilk</h2>
                    <p>100% Natural Silk Dental Floss</p>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                    <h2>Product Details</h2>
                    <ul>
                        <li><strong>LENGTH:</strong> 1 roll x 30 meters (33 yards)(99 feet).</li>
                        <li><strong>EFFECTIVELY REMOVES PLAQUE:</strong> Sinasilk removes plaque better than plastic floss because its woven texture offers more surface area than plastic.</li>
                        <li><strong>STRONG & SILKY:</strong> Sinasilk is silky smooth because it is 100% natural silk thread - arguably the strongest natural fiber known to man. Yet it is 100% compostable and can disintegrate in as little as three months. 100% silk just feels better, so you'll want to floss more, and that leads to a cleaner mouth.</li>
                        <li><strong>HEALTHY & NATURAL:</strong> Sinasilk has a subtle natural mint flavor and is coated with vegan candelilla wax to facilitate handling. Contains no bleach, dyes, or other harmful additives like Teflon – a PolyTetraFluoroEthylene (PTFE), or PolyFluoroAlkyl Substances (PFAS).</li>
                        <li><strong>REUSABLE & RECYCLABLE:</strong> Sinasilk's high quality glass bottle is reusable, washable, compact, and recyclable. Clear see-thru glass design allows you to see when you need to replace floss. Stainless steel lids prevent rust. Double lids keep floss clean. Multi-pack refills do not include a glass bottle dispenser.</li>
                    </ul>
                    <h2>Refills & Subscriptions</h2>
                    <p>Convenient 4-pack refills for Sinasilk floss. Same high-quality silk floss as the original product.</p>
                    <ul>
                        <li>1x refill every 3 months</li>
                        <li>2x refills every 6 months</li>
                        <li>3x refills every 9 months</li>
                        <li>4x refills every 12 months</li>
                    </ul>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/refill.JPG?v=1715570338692"
                            crossorigin="anonymous" alt="Sinasilk Dental Floss Refills"
                            class="product-image constrained-image"
                          />
                    </div>
                    <a href="#" class="inner-link" data-target="checkout"><h2>Request Order Form</h2></a>
                `
            },
            "sinachar": {
                "title": "",
                "content": `
                    <a href="#" class="inner-link" data-target="products">Back to Products Page</a>
                    <h2>Sinachar</h2>
                    <p>Bamboo Charcoal Infused Dental Floss</p>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div><h2>Product Details</h2>
                    <ul>
                        <li><strong>LENGTH:</strong> 1 roll x 30 meters (33 yards)(99 feet).</li>
                        <li><strong>EFFECTIVELY REMOVES PLAQUE:</strong> Sinachar removes plaque better than plastic floss because its woven texture offers more surface area than plastic, and charcoal's microscopic structure can absorb bacteria like a sponge.</li>
                        <li><strong>STRONG:</strong> Polyester thread is stronger than silk. CiCLO makes it biodegradable. CiCLO®: Synthetic Fibers for Earth's Ecosystem - Parkdale Mills</li>
                        <li><strong>NATURAL OILS:</strong> Sinachar has a subtle natural mint flavor and is coated with vegan candelilla wax to facilitate handling. Contains no bleach, dyes, or other harmful additives like Teflon – a PolyTetraFluoroEthylene (PTFE), or PolyFluoroAlkyl Substances (PFAS).</li>
                        <li><strong>REUSABLE &amp; RECYCLABLE:</strong> Sinachar's high quality glass bottle is reusable, washable, compact, and recyclable. Clear see-thru glass design allows you to see when you need to replace floss. Stainless steel lids prevent rust. Double lids keep floss clean. Multi-pack refills do not include a glass bottle dispenser.</li>
                    </ul>
                    <h2>Why Choose Sinachar?</h2>
                    <ul>
                        <li>Bamboo charcoal infused floss for superior plaque removal</li>
                        <li>Biodegradable polyester thread with CiCLO® technology</li>
                        <li>Eco-friendly and sustainable</li>
                        <li>Reusable and recyclable glass bottle with stainless steel lids</li>
                        <li>Preserves 7000+ years of Chinese bamboo culture</li>
                    </ul>
                    <button>Available Soon</button>
                    
                `
            },
            "testimonials": {
                "title": "Testimonials",
                "content": `
                    <blockquote>
                        <p><strong>James S. 5.0 out of 5 stars, Dental Student Recommended!</strong></p>
                        <p>I am a current dental student and someone recommended I try out this floss! Overall, I’ve been highly impressed with this product! Its texture is perfectly suited for flossing, effortlessly navigating through tight spaces between my teeth without shredding - a common issue I’ve encountered with many traditional threaded flosses.</p>
                        <p>For the past few years, I’ve relied on Oral-B Glide which has worked well and been comfortable to use. However, Oral-B does contain PFAS which have many associated health risks! While the extent of these risks and whether or not the amount of chemical is negligible is still up to debate, why not play it safe and go with SINAMARK’s products? Also, it has the added benefit that it’s biodegradable which is a plus for planet lovers.</p>
                        <p>The floss is just as effective as my previous flosses, and is very pleasant and comfortable to use. Also, you really do get a whole lot of bang for your buck with this product! The substantial amount of floss wound up into the “cocoon” within the bottle is not only cool to look at, but I’ve found it to last a lot longer compared to my previous flosses. There’s a lot of volume wound up in there! Highly recommended product!</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>Linda. 5.0 out of 5 stars, feels clean after flossing</strong></p>
                        <p>I want to try another floss as my dentist gave me the floss I use, and it works, but this one has a gentle feel on my gums. It didn’t break my skin like the thicker floss even as my teeth are tightly spaced together. The packaging was simple and compostable. Glad I got the opportunity to try silk floss, a natural fiber.</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>J. Takahashi. 5.0 out of 5 stars, GREAT floss in glass, not plastic!</strong></p>
                        <p>I really like this floss. Also like the idea that it’s in glass!</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>Nicholas G. 5.0 out of 5 stars, works great and environmentally friendly! :)</strong></p>
                        <p>I really like the floss, it works great, doesn’t have plastic waste so it’s environmentally friendly! Overall great product, thanks!</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>G.F. Carerra. 5.0 out of 5 stars, Environmental friendly and good for flossing.</strong></p>
                        <p>Easy to use. The best I have tried so far.</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>Anonymous. 5.0 out of 5 stars, Environmental friendly and good for flossing.</strong></p>
                        <p>I love that it’s safe for my gum and good for the environment. It’s a comfortable texture and not harsh on the gum. It does the job very well.</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>Anonymous. 5.0 out of 5 stars</strong></p>
                        <p>This floss works well. I love the fact that I can compost it!</p>
                    </blockquote>
                    <blockquote>
                        <p><strong>Byron G. 5.0 out of 5 stars, Great Floss.</strong></p>
                        <p>Works excellent for my teeth. I have bridges and tightly spaced teeth and floss works better that the other types of floss. Fast delivery.</p>
                    </blockquote>
                `
            }
        },
        "Traditional Chinese": {
            "welcome": {
            "title": "欢迎来到SINAMARK",
            "content": `
                <iframe width="100%" height="auto" src="https://www.youtube.com/embed/S_nZr3vr4ds?si=740dNtF3UbI3-CaF" 
                frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
                <div>
                    <h1>歡迎來到卓越龍牌</h1>
                    <p>
                      卓越龍牌是100%可堆肥絲綢牙線和可生物降解竹炭牙線的供應商，沒有任何有害的化學添加劑，並使用可重複使用和可回收的容器。
                    </p>
                    <p>
                      卓越龍牌的中文名字 卓越龍牌 意思是“卓越龍牌”。卓越不僅僅是外在的品質。它還包括肉眼看不見的內在品質。卓越是我們的核心價值！
                    </p>
                    <h2>為什麼選擇絲綢牙線？</h2>
                    <p>
                      絲綢是原始的牙線，直到二戰期間，塑料被用作更便宜的替代品。雖然絲綢感覺奢華，但絲綢牙線並不是奢侈品。卓越龍牌僅使用100%天然絲綢，因為絲綢是已知最強的天然線，並且100%可堆肥。
                    </p>
                    <h2>為什麼選擇竹炭？</h2>
                    <p>
                      竹子是一種生長迅速的草，因此是可持續的。竹炭的微觀結構使其能夠吸收細菌。
                    </p>
                    <h2>為什麼支持循環經濟？</h2>
                    <p>
                      當我們處理時，永遠不夠任何人使用！但是當我們重複使用時，人人有餘！開始一個健康的習慣！
                    </p>
                </div>
                <a href="#" class="inner-link" data-target="about">了解更多關於我們以及為什麼您應該選擇SINAMARK品牌</a>
            `
        },
            "about": {
                "title": "关于SINAMARK",
                "content": `
                    <p>1915年，Tong Bong 在舊金山大地震後創立了SING FAT 東方百貨公司。SING FAT 的旗艦店成為舊金山中國城重生的象徵，也是中國人在美國政府通過1882年《排華法案》後堅持留在美國的決心的象徵。一個世紀後，他的曾孫子創立了SINAMARK。</p>
                    <p>SINAMARK 的中文名字 卓越龍牌 繼承了 SING FAT 的“龍標”傳統。加入了“卓越”二字，並放在首位，因為這是我們的核心價值！卓越不僅僅是外在的品質，還包括肉眼不可見的內在品質。</p>
                    <p>SINAMARK 的願景是促進循環經濟，支持5000多年的中國絲綢和竹文化，倡導良好的牙齒健康，減少進入垃圾填埋場和海洋的塑料垃圾。</p>
                    <p>SINAMARK 的使命是通過提供可重複使用容器中的優質可堆肥產品，激發可重複使用的文藝復興，為更健康的生活和更健康的地球做出貢獻。</p>
                    <h2>我們的承諾</h2>
                    <ul>
                      <li>致力於口腔健康</li>
                      <li>致力於提供卓越的口腔護理產品</li>
                      <li>支持中國農民</li>
                      <li>保護絲綢和竹農的傳統生活方式</li>
                    </ul>
                    <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/SING%20FAT%20CO.png?v=1715649417837"
                            crossorigin="anonymous" alt=""
                            class="product-image constrained-image"
                          />
                    </div>
                `
            },
            "products": {
                "title": "我们的产品",
                "content": `
                    <a href="#" class="inner-link" data-target="silk100"><h2>Silk100</h2></a>
                      <p>100% 絲綢牙線，用於溫和且有效的清潔。可生物降解和可堆肥。</p>
                      <div class="image-container">
                        <img
                          src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/silk100.JPG?v=1715570328643"
                          crossorigin="anonymous" alt="Silk100 牙線"
                          class="product-image constrained-image"
                        />
                      </div>

                      <div class="product">
                      <a href="#" class="inner-link" data-target="sinasilk"><h2>Sinasilk</h2></a>
                      <p>高級絲綢牙線，專為最佳牙齒健康和環境可持續性設計。</p>
                      <div class="image-container">
                        <img
                          src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                          crossorigin="anonymous" alt="Sinasilk 牙線"
                          class="product-image constrained-image"
                        />
                      </div>
                      <div class="product">

                      <a href="#" class="inner-link" data-target="sinachar"><h2>Sinachar</h2></a>
                      <p>竹炭牙線，結合深層清潔與對可持續性的承諾。</p>
                      <ul>

                      </ul>
                      <a href="#" class="inner-link" data-target="sinachar">了解更多關於 Sinachar</a>
                      </div>
                      <p><strong>開始健康的習慣，使用 Sinasilk 和 Sinachar 牙線！</strong></p> 
                `
            },
            "checkout": {
                "title": "结帐",
                "content": `
                    <div>
                      <h1>如何購買</h1>
                      <h2>訂購</h2>
                      <ol>
                        <li>要下訂單，只需在提供的表格中輸入您的姓名和電子郵件地址。</li>
                        <li>我們的團隊將通過電子郵件向您發送一個安全的付款連結，以完成您的購買。</li>
                      </ol>
                      <form id="checkoutForm">
                        <label for="firstName">名字: </label>
                        <input type="text" id="firstName" name="firstName" required>
                        <br>
                        <label for="lastName">姓氏：</label>
                        <input type="text" id="lastName" name="lastName" required>
                        <br>
                        <label for="email">電子郵件地址：</label>
                        <input type="email" id="email" name="email" required>
                        <br>
                        <button type="button" onclick="submitForm()">提交</button>
                      </form>
                      <h2>安全付款處理</h2>
                      <ul>
                        <li>我們使用 Stripe，一個值得信賴和安全的支付網關，來處理所有交易。</li>
                        <li>點擊電子郵件中的付款連結以完成購買。</li>
                        <li>您的付款信息將被保密和安全。</li>
                      </ul>
                      <h2>訂單摘要</h2>
                      <ul>
                        <li>在最終確認購買之前，請查看產品和價格的明細。</li>
                        <li>總金額將包括小計、稅金和運費。</li>
                      </ul>
                      <h2>完成購買</h2>
                      <ol>
                        <li>在查看訂單詳情後，點擊電子郵件中的"立即付款"按鈕以完成購買。</li>
                        <li>您將被重定向到一個安全的 Stripe 付款頁面，以輸入您的付款信息。</li>
                        <li>一旦您的付款被處理，您將收到一封包含訂單詳情的確認電子郵件。</li>
                      </ol>
                      <h2>退貨和退款</h2>
                      <p>
                        請注意，出於衛生原因，此牙科保健產品不能退貨。如果牙線不適合您，請考慮其許多非牙科用途：
                      </p>
                      <ul>
                        <li>絲牙線比普通線更堅固，是優秀的應急縫紉工具。只需在瓶子中添加一根地毯針即可。</li>
                      </ul>
                      <p>
                        如果您對購買有任何問題，請聯繫我們的客戶支持團隊。請注意，如果多次要求退款，您的請求將根據具體情況進行審查。
                      </p>
                    </div>
                `
            },
            "faq": {
                "title": "常见问题解答（FAQ）",
                "content": `
                    <h2>常見問題解答</h2>
                    <div>
                      <h3>如何使用牙線？</h3>
                      <p>
                        使用牙線時，牙醫建議將牙線纏繞在每顆牙齒上，並垂直於牙線的長度移動牙線，並遠離牙齦（在上牙時向下，在下牙時向上）。過於粗暴地使用任何牙線都可能損傷牙齦，甚至導致齦溝。永遠不要像伐木工人鋸木頭一樣在牙齒的底部“鋸”，這只會切入牙齦。同時，避免在牙齒之間“彈”牙線，這會對牙齦施加壓力，可能導致牙齦後退。
                      </p>
                      <p>
                        如果你患有割傷，用鹽水或消毒漱口水漱口。對患處施加壓力並冷敷。這將有助於停止出血並緩解疼痛。如果持續出血，請諮詢你的牙科專業人員。
                      </p>
                    </div>

                    <div>
                      <h3>SINASILK™ 是在哪裡生產的？</h3>
                      <p>在中國 —— 絲綢生產是在5000年前這裡發明的！</p>
                    </div>

                    <div>
                      <h3>絲綢最初什麼時候被用作牙線？</h3>
                      <p>
                        <strong>史前：</strong>牙線最初使用的確切日期未知，但研究人員發現史前時代就存在牙線的證據。在史前人類的口腔中發現了牙線和牙籤的痕跡。據推測，馬毛被用作牙線，樹枝被用作牙籤以清除牙齒上的異物。
                      </p>
                      <p>
                        <strong>1815年：</strong>美國牙醫Levi Spear Parmly推介使用打蠟絲線作為牙線。在他的職業生涯後期，他出版了一本書《牙齒管理實用指南》，強調每天刷牙和使用牙線的重要性。
                      </p>
                      <p>
                        <strong>1940年代：</strong>由於第二次世界大戰期間絲綢成本上升，尼龍取代絲綢成為牙線的主要材料。
                      </p>
                    </div>

                    <div>
                      <h3>哪種牙線最好 —— 竹炭、木炭、玉米還是絲綢？</h3>
                      <p>
                        首先，木炭可以由任何有機物製成。其次，“竹炭牙線”的描述非常誤導人。竹炭不是線本身——從燃燒竹子得到的炭被注入線中。第三，線由聚酯或尼龍製成——一種基於石油的塑料，不可堆肥。塑料可以是生物基的，但化學上仍然是塑料。由於絲綢牙線從未注入過炭，最適合注入的材料是聚酯線。玉米PLA（聚乳酸，一種生物基塑料）是100%可堆肥的，但比絲綢或聚酯弱得多。
                      </p>
                      <p>
                        <strong>底線</strong><br />
                        絲綢是最強的100%可堆肥，100%天然纖維牙線！
                      </p>
                    </div>

                    <div>
                      <h3>什麼是燭木蠟（有時拼寫為Candelilly）？</h3>
                      <p>
                        燭木蠟（CW）是從生長在墨西哥北部和美國西南部的小灌木的葉子中獲得的蠟，該植物屬於大戟科，學名為Euphorbia cerifera和Euphorbia antisyphilitica。燭木蠟是無毒且食品安全的。它已被食品和藥物管理局（FDA）批准用於食品產品中。FDA還規範化妝品，並批准將燭木蠟用於美容產品中。
                      </p>
                    </div>

                    <div>
                      <h3>什麼是自然？</h3>
                      <p>
                        自然：來自大自然；不人造，也不涉及任何人造或由人類造成的東西。絲綢是一種天然纖維！
                      </p>
                      <p>
                        如果食品級產品被描述為天然，這意味著它沒有添加任何人造化學物質——無PTFE，無PFAS！
                      </p>
                      <p>
                        <strong>來源：</strong>劍橋詞典
                      </p>
                    </div>

                    <div>
                      <h3>什麼是PTFE？</h3>
                      <p>聚四氟乙烯——品牌名Teflon®</p>
                      <p>
                        PTFE與Teflon®沒有更好或更差，因為它們實際上是同一物質——名稱不同，其他無異。
                      </p>
                      <p>
                        <strong>來源：</strong>"牙線和其他行為與體內PFAS含量較高有關。"Silentspring.org
                      </p>
                    </div>

                    <div>
                      <h3>什麼是PFAS？</h3>
                      <p>多氟烷基物質</p>
                      <p>
                        <strong>來源：</strong>EPA, "人類健康與環境風險"
                      </p>
                    </div>

                    <div>
                      <h3>可堆肥、可回收和生物降解之間有什麼區別？</h3>
                      <div>
                        <h4>可堆肥</h4>
                        <p>
                          堆肥是將天然材料製成的物品變成富含養分的土壤的一種方式。堆肥通常用於食物廢物，但其他完全可堆肥的物品包括庭院廢料、枯萎的花朵、未經處理的木材製品和純棉製品。從食物廢物開始是最簡單的，但越來越多你會發現其他生活中的物品也完全可以堆肥。
                        </p>
                        <p>
                          可堆肥物品很棒，因為它們不是去填埋場，也不需要被加工成其他東西，它們實際上在自然環境中（或在工業設施中）自行分解，立即創造出有用的東西。
                        </p>
                        <p>
                          但是，如果你有可堆肥的物品卻無法進行堆肥會怎樣呢？附帶說一句：你可以在自己的後院（或櫥下）創建一個堆肥桶。我们知道這不是每個人都適合的。那麼，如果這些物品最終只是進入你的標準垃圾桶會怎樣呢？你可能會認為這仍然是一種改進，它們會分解，對吧？很遺憾告訴你，情況並非如此。可堆肥物品只有在擁有正確條件的情況下才會分解成富含養分的土壤。傳統的填埋場並不是具備正確條件的地方。
                        </p>
                        <p>
                          工業設施具有最佳的堆肥條件。這些設施調節溫度、濕度和氣流，以確保可堆肥物品盡可能快地分解。家庭堆肥更容易受到溫度/濕度/氣流變化的影響，可能不會像在工業設施中那樣快速分解。
                        </p>
                        <p>
                          堆肥在有氧接觸和定期翻動的情況下效果最佳。填埋場基本上是相反的。它是一個厭氧環境，大部分堆肥實際上沒有接觸到氧氣。這意味著，如果你的可堆肥外賣容器最終在填埋場，它不會按預期分解。相反，它最有可能只是像塑料容器一樣停留更長的時間。
                        </p>
                        <p>
                          因此，雖然識別可堆肥物品是一個好的開始，但在其他物品代替時購買和使用可堆肥物品對於影響最大，當它們真正最終進入堆肥堆時。不過，我们還要提到，塑料的生產對於許多原因來說是相當糟糕的，所以選擇由棉、竹子甚至PLA（聚乳酸——你在餐館看到的那種植物基塑料杯和容器）製成的可堆肥物品，對環境和你的健康可能仍然更好。
                        </p>
                      </div>
                      <div>
                      <h4>可回收</h4>
                      <p>
                        回收是將產品分解再利用的過程，通常用作原材料。我們都知道可以回收紙張、塑膠和罐頭。在大多數地方，回收設施也能處理玻璃。這一切都很好，但讓我們更深入地了解這個概念。請注意，每個城市的情況略有不同，您應該確切檢查您所在地區可以回收和不能回收的物品。
                      </p>
                      <p>
                        把你認為或希望可以回收的東西扔進回收箱通常是一種美好的願望或理想化回收。雖然你的出發點是好的，但這樣做實際上可能比直接扔掉不清楚的東西更糟。為什麼？因為那一個不確定的物品可能足以破壞一整批回收物，這可能意味著所有東西都最終進入垃圾填埋場，而不僅僅是那一個有問題的物品。在這種情況下，最好的選擇是在處理之前先確認。如果您所在的社區不回收它，請要求您的城市開始接受這些物品。但與此同時，如果您不確定，不要只是希望它可以被回收。
                      </p>
                      <p>
                        回到手邊的話題，什麼實際上是可回收的？大多數保持形狀的塑料都可以回收（如水瓶、食品容器、家用品瓶等）。在某些地方，他們甚至已經開始接受如塑料購物袋、縮環包裝和塑料膜等物品，如果包裝得當的話。其他常見的可回收物品包括紙張、紙板、未破碎的玻璃和金屬（包括鋁箔，如果它是乾淨的且是足夠大的球形）。
                      </p>
                      <p>
                        一些需要特殊回收（但事實上是可回收的）的常見物品包括：電池、電子產品和織物（和衣物）。請與您的廢物管理提供者聯繫，查看您所在地區可以和不能回收的物品。
                      </p>
                    </div>

                    <div>
                      <h4>生物降解</h4>
                      <p>
                        生物降解的定義是一種能夠自然分解而不造成任何傷害的物質。這與可堆肥非常相似，但最大的區別是它分解後不會造成傷害，而不是從有機發生的材料開始。因此，人造或化學製造的物品仍然可以被認為是生物降解的，而不必然是可堆肥的。這就像正方形是矩形，但矩形不是正方形。那些可堆肥的物品也是生物降解的，但不是所有生物降解的物品都是可堆肥的。
                      </p>
                      <p>
                        再次強調，生物降解選項仍然是朝著正確方向的一步。這意味著成分會隨著時間的推移而分解，當它們分解時，基本組分對環境無害。
                      </p>
                      <p>
                        生物降解材料的一個缺點是沒有確切的時間框架來指明物品何時會分解。可能需要多年時間才會開始降解。在大多數情況下，生物降解並不真正說明該產品的多少。
                      </p>
                    </div>

                    <p>
                      <strong>底線</strong>
                      <br />
                      如果我們要對這些術語進行排名，看看哪些對地球和我們的健康最好，我們會說首先尋找可堆肥的物品，其次是可回收的物品，最後是生物降解的物品。如果妥善處理，可堆肥物品會完全分解，並可用於培養更多資源。可回收物品可以轉化為原材料，然後用來製造新的東西，無需創造全新的資源。最後，生物降解選項最終會分解，但我們不知道何時，也沒有計劃用它們來提供任何額外的好處。
                    </p>
                    <p>
                      <strong>來源：</strong>環境健康中心
                    </p>
                `
            },
            "blog": {
                  "title": "SINAMARK博客",
                  "content": `
                      <h2>特色文章</h2>
                      <div id="substack-feed-embed"></div>
                      <script>
                        window.SubstackFeedWidget = {
                          substackUrl: "sinasilk.substack.com",
                          posts: 4,
                          layout: "right",
                          colors: {
                            primary: "#00621C",
                            secondary: "#A0A0A0",
                            background: "#FFFFFF00",
                          }
                        };
                      </script>
                      <script src="https://substackapi.com/embeds/feed.js" async></script>
                      
                  `
              },
              "silk100": {
                  "title": "Silk100",
                  "content": `
                      <a href="#" class="inner-link" data-target="products">返回產品頁面</a>
                      <p>100% 天然丝绸牙线</p>
                      <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                      <h2>产品详情</h2>
                      <ul>
                          <li><strong>长度：</strong>一卷30米（33码）（99英尺）。</li>
                          <li><strong>有效去除牙菌斑：</strong>Silk100因其编织纹理比塑料提供更多表面积，因此比塑料牙线更能有效去除牙菌斑。</li>
                          <li><strong>坚固且丝滑：</strong>Silk100是100%天然丝线，可能是人类已知的最强大的天然纤维。它是100%可堆肥的，可以在短短三个月内分解。100%丝绸触感更好，所以你会更想要使用牙线，这将导致口腔更干净。</li>
                          <li><strong>健康与自然：</strong>Silk100具有微妙的天然薄荷味，并涂有素食者的小烛树蜡以方便处理。不含漂白剂、染料或其他有害添加剂，如特氟龙（PTFE）或多氟烷基物质（PFAS）。</li>
                          <li><strong>可重复使用与可回收：</strong>Silk100的高质量玻璃瓶可重复使用、可洗涤、紧凑且可回收。透明的玻璃设计让您可以看到何时需要更换牙线。不锈钢盖防锈。双盖保持牙线清洁。多包装补充装不包括玻璃瓶分配器。</li>
                      </ul>
                      <h2>补充装与订阅</h2>
                      <p>方便的4包装Silk100牙线补充装。与原始产品相同的高品质丝绸牙线。</p>
                      <ul>
                          <li>每3个月1次补充装</li>
                          <li>每6个月2次补充装</li>
                          <li>每9个月3次补充装</li>
                          <li>每12个月4次补充装</li>
                      </ul>
                      <h2>为什么选择Silk100？</h2>
                      <ul>
                          <li>100%天然、可堆肥和生物可降解的丝绸</li>
                          <li>其编织纹理有效去除牙菌斑</li>
                          <li>丝滑且对牙龈温和</li>
                          <li>环保且可持续</li>
                          <li>可重复使用和可回收的玻璃瓶及不锈钢盖</li>
                      </ul>
                      <div class="image-container">
                            <img
                              src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/refill.JPG?v=1715570338692"
                              crossorigin="anonymous" alt="Sinasilk Dental Floss Refills"
                              class="product-image constrained-image"
                            />
                      </div>
                      <a href="#" class="inner-link" data-target="checkout"><h2>請求訂單表格</h2></a>
                  `
              },
              "sinasilk": {
                  "title": "Sinasilk",
                  "content": `
                      <a href="#" class="inner-link" data-target="products">返回產品頁面</a>
                      <p>100% 天然丝绸牙线</p>
                      <div class="image-container">
                          <img
                            src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/Sinasilk%202%20main%20image.JPG?v=1715387220468"
                            crossorigin="anonymous" alt="Silk100 Dental Floss"
                            class="product-image constrained-image"
                          />
                        </div>
                      <h2>产品详情</h2>
                      <ul>
                          <li><strong>长度：</strong>一卷30米（33码）（99英尺）。</li>
                          <li><strong>有效去除牙菌斑：</strong>Sinasilk因其编织纹理比塑料提供更多表面积，因此比塑料牙线更能有效去除牙菌斑。</li>
                          <li><strong>坚固且丝滑：</strong>Sinasilk是100%天然丝线，可能是人类已知的最强大的天然纤维。它是100%可堆肥的，可以在短短三个月内分解。100%丝绸触感更好，所以你会更想要使用牙线，这将导致口腔更干净。</li>
                          <li><strong>健康与自然：</strong>Sinasilk具有微妙的天然薄荷味，并涂有素食者的小烛树蜡以方便处理。不含漂白剂、染料或其他有害添加剂，如特氟龙（PTFE）或多氟烷基物质（PFAS）。</li>
                          <li><strong>可重复使用与可回收：</strong>Sinasilk的高质量玻璃瓶可重复使用、可洗涤、紧凑且可回收。透明的玻璃设计让您可以看到何时需要更换牙线。不锈钢盖防锈。双盖保持牙线清洁。多包装补充装不包括玻璃瓶分配器。</li>
                      </ul>
                      <h2>补充装与订阅</h2>
                      <p>方便的4包装Sinasilk牙线补充装。与原始产品相同的高品质丝绸牙线。</p>
                      <ul>
                          <li>每3个月1次补充装</li>
                          <li>每6个月2次补充装</li>
                          <li>每9个月3次补充装</li>
                          <li>每12个月4次补充装</li>
                      </ul>
                      <h2>为什么选择Sinasilk？</h2>
                      <ul>
                          <li>100%天然、可堆肥和生物可降解的丝绸</li>
                          <li>其编织纹理有效去除牙菌斑</li>
                          <li>丝滑且对牙龈温和</li>
                          <li>环保且可持续</li>
                          <li>可重复使用和可回收的玻璃瓶及不锈钢盖</li>
                          <li>保护5000多年的中国丝绸文化</li>
                      </ul>
                      <div class="image-container">
                            <img
                              src="https://cdn.glitch.com/b524bd7c-2cd3-4f31-8a22-f1e9fa4b5a87/refill.JPG?v=1715570338692"
                              crossorigin="anonymous" alt="Sinasilk Dental Floss Refills"
                              class="product-image constrained-image"
                            />
                      </div>
                      <a href="#" class="inner-link" data-target="checkout"><h2>請求訂單表格</h2></a>
                  `
              },
              "sinachar": {
                  "title": "Sinachar",
                  "content": `
                      <a href="#" class="inner-link" data-target="products">返回產品頁面</a>
                      <p>竹炭牙线</p>
                      
                      <h2>产品详情</h2>
                      <ul>
                          <li><strong>长度：</strong>一卷30米（33码）（99英尺）。</li>
                          <li><strong>有效去除牙菌斑：</strong>Sinachar比塑料牙线更能有效去除牙菌斑，因为其编织纹理提供了比塑料更多的表面积，竹炭的微观结构可以像海绵一样吸收细菌。</li>
                          <li><strong>坚固：</strong>聚酯纤维线比丝绸更坚固。CiCLO技术使其可生物降解。CiCLO®：为地球生态系统设计的合成纤维 - Parkdale Mills</li>
                          <li><strong>天然油：</strong>Sinachar具有微妙的天然薄荷味，并涂有素食者的小烛树蜡以方便处理。不含漂白剂、染料或其他有害添加剂，如特氟龙（PTFE）或多氟烷基物质（PFAS）。</li>
                          <li><strong>可重复使用与可回收：</strong>Sinachar的高质量玻璃瓶可重复使用、可洗涤、紧凑且可回收。透明的玻璃设计让您可以看到何时需要更换牙线。不锈钢盖防锈。双盖保持牙线清洁。多包装补充装不包括玻璃瓶分配器。</li>
                      </ul>
                      <h2>为什么选择Sinachar？</h2>
                      <ul>
                          <li>注入竹炭的牙线，具有卓越的去除牙菌斑能力</li>
                          <li>带有CiCLO®技术的可生物降解聚酯纤维线</li>
                          <li>环保且可持续</li>
                          <li>可重复使用和可回收的玻璃瓶及不锈钢盖</li>
                          <li>保护7000多年的中国竹文化</li>
                      </ul>
                      <button>加入购物车</button>
                  `
              },
              "testimonials": {
                  "title": "推荐书",
                  "content": `
                      <blockquote>
                          <p><strong>James S. 5顆星中的5顆星，牙科學生推薦！</strong></p>
                          <p>我是一名現任牙科學生，有人推薦我試試這款牙線！總的來說，我對這個產品印象非常深刻！它的質地非常適合牙線，可以輕鬆地穿過我的牙齒之間的狹窄空間而不會斷裂——這是我在使用許多傳統牙線時遇到的常見問題。</p>
                          <p>在過去的幾年裡，我一直依賴Oral-B Glide，它工作得很好，也很舒服使用。然而，Oral-B含有許多與健康風險相關的PFAS！雖然這些風險的程度和化學物質的量是否可忽略不計仍有待討論，但為什麼不謹慎行事，選擇卓越龍牌的產品呢？此外，它還具有可生物降解的附加優勢，這對愛護地球的人來說是個好消息。</p>
                          <p>這款牙線和我之前用過的牙線一樣有效，非常愉快且舒適。並且，你確實能從這個產品中獲得很多價值！瓶子內的“繭”中纏繞了大量牙線，不僅看起來很酷，而且我發現它比我以前的牙線持續更長時間。纏繞在裡面的量很多！強烈推薦這款產品！</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>Linda. 5顆星中的5顆星，使用牙線後感覺很乾淨</strong></p>
                          <p>我想嘗試另一種牙線，因為我的牙醫給了我使用的牙線，雖然它有效，但這款牙線對我的牙齦感覺很溫和。即使我的牙齒緊密排列，它也沒有像較厚的牙線那樣傷害我的牙齦。包裝簡單且可堆肥。很高興有機會嘗試絲綢牙線，一種天然纖維。</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>J. Takahashi. 5顆星中的5顆星，很棒的玻璃牙線，不是塑料！</strong></p>
                          <p>我真的很喜歡這款牙線，也喜歡它是玻璃裝的這個想法！</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>Nicholas G. 5顆星中的5顆星，效果很好且環保！ :)</strong></p>
                          <p>我真的很喜歡這款牙線，它效果很好，沒有塑料垃圾，因此很環保！總體上是一款很棒的產品，謝謝！</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>G.F. Carerra. 5顆星中的5顆星，環保且適合使用。</strong></p>
                          <p>使用起來很方便。我試過的最好的一款。</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>匿名. 5顆星中的5顆星，環保且適合使用。</strong></p>
                          <p>我喜歡它對我的牙齦安全且對環境有益。質地舒適，不會刺激牙齦。效果非常好。</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>匿名. 5顆星中的5顆星</strong></p>
                          <p>這款牙線效果很好。我喜歡它可以被堆肥！</p>
                      </blockquote>
                      <blockquote>
                          <p><strong>Byron G. 5顆星中的5顆星，超棒的牙線。</strong></p>
                          <p>對我的牙齒效果很好。我有牙橋和緊密排列的牙齒，這款牙線比其他類型的牙線效果更好。快速交貨。</p>
                      </blockquote>
                  `
              }

        }
    };
// 5. State Variables
    let currentLanguage = 'English';
    let isDarkMode = false;
// 6. Content Update Functions
    function updateContent() {
        containers.forEach(container => {
            const id = container.id;
            if (contentTranslations[currentLanguage][id]) {
                container.innerHTML = `<h2>${contentTranslations[currentLanguage][id].title}</h2>${contentTranslations[currentLanguage][id].content}`;

                // Check if it's the blog container and then initialize the appropriate Substack feed
                if (id === 'blog') {
                    initializeSubstackFeed(currentLanguage);
                }

                addInnerLinksEvent(container);
            }
        });
    }
// 7. Inner Links Event Handler
    function addInnerLinksEvent(container) {
        const innerLinks = container.querySelectorAll('.inner-link');
        innerLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.dataset.target;
                const targetContainer = document.getElementById(targetId);
                if (targetContainer) {
                    containers.forEach(cont => cont.style.display = 'none');
                    targetContainer.style.display = 'block';
                    updateContent();
                    targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
// 8. Navigation Update Function
    function updateNavigation() {
        navLinks.forEach(link => {
            if (link.hasAttribute('data-target')) {
                const target = link.dataset.target;
                link.textContent = menuTranslations[currentLanguage][target];

                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.dataset.target;

                    containers.forEach(container => container.style.display = 'none');

                    const targetContainer = document.getElementById(targetId);
                    if (targetContainer) {
                        targetContainer.style.display = 'block';
                    }

                    updateContent();
                    targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        });
    }
// 9. Dark Mode Toggle Function
    function toggleDarkMode(e) {
        e.preventDefault();  // Prevents the default action
        e.stopPropagation(); // Stops the event from propagating to parent elements
        isDarkMode = !isDarkMode;
        body.classList.toggle('dark-mode');
        darkModeToggle.textContent = isDarkMode ? menuTranslations[currentLanguage]['lightMode'] : menuTranslations[currentLanguage]['darkMode'];
    }
// Section 10: Language Toggle Function
    function toggleLanguage(e) {
        e.preventDefault();
        currentLanguage = (currentLanguage === 'English' ? 'Traditional Chinese' : 'English');
      // Toggle image visibility based on the current language
        if (currentLanguage === 'English') {
            document.getElementById('headerImageEN').style.display = 'block';
            document.getElementById('headerImageCN').style.display = 'none';
        } else {
            document.getElementById('headerImageEN').style.display = 'none';
            document.getElementById('headerImageCN').style.display = 'block';
        }
        updateContent();
        updateNavigation();
        pageTitle.textContent = pageTitles[currentLanguage];
        headerTitle.textContent = pageTitles[currentLanguage];
        langToggle.textContent = menuTranslations[currentLanguage]['language'];
        darkModeToggle.textContent = isDarkMode ? menuTranslations[currentLanguage]['lightMode'] : menuTranslations[currentLanguage]['darkMode'];   
    }
    document.querySelector('.language-toggle').addEventListener('click', toggleLanguage);
// 11. Event Listeners for Toggles
    langToggle.addEventListener('click', toggleLanguage);
    darkModeToggle.addEventListener('click', toggleDarkMode);

// 12. Initial Page Setup
    updateContent();
    updateNavigation();
    pageTitle.textContent = pageTitles[currentLanguage];
    headerTitle.textContent = pageTitles[currentLanguage];
    langToggle.textContent = menuTranslations[currentLanguage]['language'];
    darkModeToggle.textContent = menuTranslations[currentLanguage]['darkMode'];
});
// Section 13: Function to dynamically add Substack feed
    function initializeSubstackFeed(language) {
        let substackUrl = "sinamark.substack.com"; // Default to the English blog
        if (language === "Traditional Chinese") {
            substackUrl = "sinasilk.substack.com"; // Use the Chinese blog
        }

        const feedContainer = document.getElementById('substack-feed-embed');
        if (feedContainer) {
            feedContainer.innerHTML = ''; // Clear previous content
            const script = document.createElement('script');
            script.innerHTML = `
                window.SubstackFeedWidget = {
                    substackUrl: "${substackUrl}",
                    posts: 4,
                    layout: "right",
                    colors: {
                        primary: "#00621C",
                        secondary: "#A0A0A0",
                        background: "#FFFFFF00",
                    }
                };
            `;
            const scriptSrc = document.createElement('script');
            scriptSrc.src = "https://substackapi.com/embeds/feed.js";
            scriptSrc.async = true;

            feedContainer.appendChild(script);
            feedContainer.appendChild(scriptSrc);
        } else {
            console.error('Substack feed container not found.');
        }
    }
// 14. Call the function to add Substack feed when blog section is clicked
    const blogNavLink = document.querySelector('.nav a[data-target="blog"]');
    blogNavLink.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default navigation behavior
        currentContainerId = this.dataset.target;
        addSubstackFeed(currentContainerId);
    });
// 15. Function to handle image load error
    function imageLoadError() {
        const headerTitle = document.getElementById('headerTitle');
        headerTitle.style.display = 'block';  // Show the header text if the image fails to load
    }
// 16. Checkout form
function submitForm() {
    var form = document.getElementById('checkoutForm');
    var data = new FormData(form);
    fetch('https://script.google.com/macros/s/AKfycbxOLfHCU_7DhDfFLMWLwp92RV7H2QQF6uLm5qKS9wEuf0Fr-0mXUiRfBnA3zNoLMjbK/exec', {
      method: 'POST',
      body: data
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert('Thank you for your submission!');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred, please try again.');
    });
}
