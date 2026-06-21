from cbse_chapter_data import (
    get_chapters_by_class_subject as get_cbse_chapters_by_class_subject,
    get_all_subjects_for_class as get_cbse_all_subjects_for_class,
    get_chapter_details as get_cbse_chapter_details,
)


RBSE_CHAPTER_DATA = {
    "9": {
        "Mathematics": [
            {"chapter_number": 1, "chapter_name": "Number Systems", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 2, "chapter_name": "Polynomials", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 3, "chapter_name": "Coordinate Geometry", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Linear Equations in Two Variables", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 5, "chapter_name": "Introduction to Euclid's Geometry", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 6, "chapter_name": "Lines and Angles", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 7, "chapter_name": "Triangles", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 8, "chapter_name": "Quadrilaterals", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 9, "chapter_name": "Circles", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 10, "chapter_name": "Heron's Formula", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 11, "chapter_name": "Surface Areas and Volumes", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 12, "chapter_name": "Statistics", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Science": [
            {"chapter_number": 1, "chapter_name": "Matter in Our Surroundings", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Is Matter Around Us Pure", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Atoms and Molecules", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 4, "chapter_name": "Structure of the Atom", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 5, "chapter_name": "The Fundamental Unit of Life", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 6, "chapter_name": "Tissues", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 7, "chapter_name": "Motion", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 8, "chapter_name": "Force and Laws of Motion", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 9, "chapter_name": "Gravitation", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 10, "chapter_name": "Work and Energy", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 11, "chapter_name": "Sound", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 12, "chapter_name": "Improvement in Food Resources", "total_questions": 50, "difficulty": "Easy", "duration": 35},
        ],
        "History": [
            {"chapter_number": 1, "chapter_name": "The French Revolution", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 2, "chapter_name": "Socialism in Europe and the Russian Revolution", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 3, "chapter_name": "Nazism and the Rise of Hitler", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 4, "chapter_name": "Forest Society and Colonialism", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Pastoralists in the Modern World", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Geography": [
            {"chapter_number": 1, "chapter_name": "India - Size and Position", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Physical Features of India", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Drainage", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Climate", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Natural Vegetation and Wildlife", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 6, "chapter_name": "Population", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Political Science": [
            {"chapter_number": 1, "chapter_name": "What is Democracy? Why Democracy?", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Constitutional Design", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Electoral Politics", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Working of Institutions", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Democratic Rights", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Economics": [
            {"chapter_number": 1, "chapter_name": "The Story of Village Palampur", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "People as Resource", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Poverty as a Challenge", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Food Security in India", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "English Beehive (Prose)": [
            {"chapter_number": 1, "chapter_name": "The Fun They Had", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 2, "chapter_name": "The Sound of Music", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 3, "chapter_name": "The Little Girl", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 4, "chapter_name": "A Truly Beautiful Mind", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "The Snake and the Mirror", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 6, "chapter_name": "My Childhood", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 7, "chapter_name": "Reach for the Top", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Kathmandu", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 9, "chapter_name": "If I Were You", "total_questions": 45, "difficulty": "Easy", "duration": 30},
        ],
        "English Beehive (Poetry)": [
            {"chapter_number": 1, "chapter_name": "The Road Not Taken", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 2, "chapter_name": "Wind", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 3, "chapter_name": "Rain on the Roof", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 4, "chapter_name": "The Lake Isle of Innisfree", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 5, "chapter_name": "A Legend of the Northland", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 6, "chapter_name": "No Men Are Foreign", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 7, "chapter_name": "On Killing a Tree", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 8, "chapter_name": "A Slumber Did My Spirit Seal", "total_questions": 40, "difficulty": "Easy", "duration": 25},
        ],
        "English Moments": [
            {"chapter_number": 1, "chapter_name": "The Lost Child", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 2, "chapter_name": "The Adventures of Toto", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Iswaran the Storyteller", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 4, "chapter_name": "In the Kingdom of Fools", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 5, "chapter_name": "The Happy Prince", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Weathering the Storm in Ersama", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 7, "chapter_name": "The Last Leaf", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "A House Is Not a Home", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 9, "chapter_name": "The Beggar", "total_questions": 45, "difficulty": "Easy", "duration": 30},
        ],
        "Hindi Kshitij (Prose)": [
            {"chapter_number": 1, "chapter_name": "Do Bailon Ki Katha", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Lhasa Ki Or", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Upabhoktvad Ki Sanskriti", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 4, "chapter_name": "Sanwale Sapnon Ki Yaad", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Premchand Ke Phate Jute", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Mere Bachpan Ke Din", "total_questions": 45, "difficulty": "Easy", "duration": 30},
        ],
        "Hindi Kshitij (Poetry)": [
            {"chapter_number": 1, "chapter_name": "Sakhiyan Evam Sabad", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 2, "chapter_name": "Vaakh", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 3, "chapter_name": "Savaiye", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 4, "chapter_name": "Kaidi Aur Kokila", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 5, "chapter_name": "Gram Shri", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 6, "chapter_name": "Chandra Gahana Se Lautati Ber", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 7, "chapter_name": "Megh Aaye", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 8, "chapter_name": "Bacche Kam Par Ja Rahe Hain", "total_questions": 40, "difficulty": "Medium", "duration": 25},
        ],
        "Hindi Kritika": [
            {"chapter_number": 1, "chapter_name": "Is Jal Pralay Mein", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Mere Sang Ki Auraten", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Ridh Ki Haddi", "total_questions": 45, "difficulty": "Medium", "duration": 30},
        ],
        "Sanskrit Shemushi": [
            {"chapter_number": 1, "chapter_name": "Bharativasantagiti", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Swarnakakah", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Godohanam", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 4, "chapter_name": "Suktimauktikam", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Bhranto Balah", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Lauhatula", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 7, "chapter_name": "Siktasetu", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Jatayoh Shauryam", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 9, "chapter_name": "Paryavaranam", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 10, "chapter_name": "Vangmanahpranasvarupam", "total_questions": 40, "difficulty": "Medium", "duration": 30},
        ],
    },
    "10": {
        "Mathematics": [
            {"chapter_number": 1, "chapter_name": "Real Numbers", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 2, "chapter_name": "Polynomials", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 3, "chapter_name": "Pair of Linear Equations in Two Variables", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 4, "chapter_name": "Quadratic Equations", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 5, "chapter_name": "Arithmetic Progressions", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 6, "chapter_name": "Triangles", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 7, "chapter_name": "Coordinate Geometry", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 8, "chapter_name": "Introduction to Trigonometry", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 9, "chapter_name": "Some Applications of Trigonometry", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 10, "chapter_name": "Circles", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 11, "chapter_name": "Areas Related to Circles", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 12, "chapter_name": "Surface Areas and Volumes", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 13, "chapter_name": "Statistics", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 14, "chapter_name": "Probability", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Science": [
            {"chapter_number": 1, "chapter_name": "Chemical Reactions and Equations", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 2, "chapter_name": "Acids, Bases and Salts", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 3, "chapter_name": "Metals and Non-metals", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 4, "chapter_name": "Carbon and its Compounds", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 5, "chapter_name": "Life Processes", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 6, "chapter_name": "Control and Coordination", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 7, "chapter_name": "How do Organisms Reproduce?", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 8, "chapter_name": "Heredity", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 9, "chapter_name": "Light - Reflection and Refraction", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 10, "chapter_name": "The Human Eye and the Colorful World", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 11, "chapter_name": "Electricity", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 12, "chapter_name": "Magnetic Effects of Electric Current", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 13, "chapter_name": "Our Environment", "total_questions": 50, "difficulty": "Easy", "duration": 35},
        ],
        "History": [
            {"chapter_number": 1, "chapter_name": "The Rise of Nationalism in Europe", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 2, "chapter_name": "Nationalism in India", "total_questions": 55, "difficulty": "Medium", "duration": 40},
            {"chapter_number": 3, "chapter_name": "The Making of a Global World", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "The Age of Industrialization", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Print Culture and the Modern World", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Geography": [
            {"chapter_number": 1, "chapter_name": "Resources and Development", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Forest and Wildlife Resources", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Water Resources", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Agriculture", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Minerals and Energy Resources", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 6, "chapter_name": "Manufacturing Industries", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Political Science": [
            {"chapter_number": 1, "chapter_name": "Power Sharing", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Federalism", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Gender, Religion and Caste", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Political Parties", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Outcomes of Democracy", "total_questions": 50, "difficulty": "Medium", "duration": 35},
        ],
        "Economics": [
            {"chapter_number": 1, "chapter_name": "Development", "total_questions": 50, "difficulty": "Easy", "duration": 35},
            {"chapter_number": 2, "chapter_name": "Sectors of the Indian Economy", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 3, "chapter_name": "Money and Credit", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 4, "chapter_name": "Globalization and the Indian Economy", "total_questions": 50, "difficulty": "Medium", "duration": 35},
            {"chapter_number": 5, "chapter_name": "Consumer Rights", "total_questions": 50, "difficulty": "Easy", "duration": 35},
        ],
        "English First Flight (Prose)": [
            {"chapter_number": 1, "chapter_name": "A Letter to God", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Nelson Mandela: Long Walk to Freedom", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Two Stories about Flying", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 4, "chapter_name": "From the Diary of Anne Frank", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Glimpses of India", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Mijbil the Otter", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 7, "chapter_name": "Madam Rides the Bus", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 8, "chapter_name": "The Sermon at Benares", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 9, "chapter_name": "The Proposal", "total_questions": 45, "difficulty": "Easy", "duration": 30},
        ],
        "English First Flight (Poetry)": [
            {"chapter_number": 1, "chapter_name": "Dust of Snow", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 2, "chapter_name": "Fire and Ice", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 3, "chapter_name": "A Tiger in the Zoo", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 4, "chapter_name": "How to Tell Wild Animals", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 5, "chapter_name": "The Ball Poem", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 6, "chapter_name": "Amanda!", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 7, "chapter_name": "The Trees", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 8, "chapter_name": "Fog", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 9, "chapter_name": "The Tale of Custard the Dragon", "total_questions": 40, "difficulty": "Easy", "duration": 25},
            {"chapter_number": 10, "chapter_name": "For Anne Gregory", "total_questions": 40, "difficulty": "Easy", "duration": 25},
        ],
        "English Footprints Without Feet": [
            {"chapter_number": 1, "chapter_name": "A Triumph of Surgery", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 2, "chapter_name": "The Thief's Story", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 3, "chapter_name": "The Midnight Visitor", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 4, "chapter_name": "A Question of Trust", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Footprints without Feet", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 6, "chapter_name": "The Making of a Scientist", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 7, "chapter_name": "The Necklace", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Bholi", "total_questions": 45, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 9, "chapter_name": "The Book That Saved the Earth", "total_questions": 45, "difficulty": "Easy", "duration": 30},
        ],
        "Hindi Kshitij (Poetry)": [
            {"chapter_number": 1, "chapter_name": "Pad", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 2, "chapter_name": "Ram-Lakshman-Parashuram Samvad", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 3, "chapter_name": "Atmakathya", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 4, "chapter_name": "Utsah / At Nahin Rahi Hai", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 5, "chapter_name": "Yah Danturit Muskan / Fasal", "total_questions": 40, "difficulty": "Medium", "duration": 25},
            {"chapter_number": 6, "chapter_name": "Sangatkar", "total_questions": 40, "difficulty": "Medium", "duration": 25},
        ],
        "Hindi Kshitij (Prose)": [
            {"chapter_number": 7, "chapter_name": "Netaji Ka Chashma", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Balgobin Bhagat", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 9, "chapter_name": "Lakhanavi Andaz", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 10, "chapter_name": "Ek Kahani Yah Bhi", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 11, "chapter_name": "Naubatkhane Mein Ibadat", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 12, "chapter_name": "Sanskriti", "total_questions": 45, "difficulty": "Medium", "duration": 30},
        ],
        "Hindi Kritika": [
            {"chapter_number": 1, "chapter_name": "Mata Ka Anchal", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Sana-Sana Hath Jodi", "total_questions": 45, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Main Kyon Likhta Hoon?", "total_questions": 45, "difficulty": "Medium", "duration": 30},
        ],
        "Sanskrit Shemushi": [
            {"chapter_number": 1, "chapter_name": "Shuchiparyavaranam", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Buddhirbalavati Sada", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Shishulalanam", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 4, "chapter_name": "Janani Tulyavatsala", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Subhashitani", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Sauhardam Prakriteh Shobha", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 7, "chapter_name": "Vichitrah Sakshi", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Suktayah", "total_questions": 40, "difficulty": "Medium", "duration": 30},
        ],
        "Urdu Jaan Pehchaan": [
            {"chapter_number": 1, "chapter_name": "Khuda Ki Tarif", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 2, "chapter_name": "Betakallufi", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 3, "chapter_name": "Neki Aur Badi", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 4, "chapter_name": "Zubaan Ki Baat", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 5, "chapter_name": "Hakim Ajmal Khan", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 6, "chapter_name": "Kadam Badhao Doston", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 7, "chapter_name": "Zulahe Aur Baniye Ki Ladai", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 8, "chapter_name": "Internet", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 9, "chapter_name": "Nai Roshni", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 10, "chapter_name": "Pahadon Ki Malika - Darjeeling", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 11, "chapter_name": "Os", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 12, "chapter_name": "Albeli Subah", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 13, "chapter_name": "Hamari Tarikh", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 14, "chapter_name": "Kartoos", "total_questions": 40, "difficulty": "Medium", "duration": 30},
            {"chapter_number": 15, "chapter_name": "Gulli-Danda", "total_questions": 40, "difficulty": "Easy", "duration": 30},
            {"chapter_number": 16, "chapter_name": "Robot", "total_questions": 40, "difficulty": "Easy", "duration": 30},
        ],
    },
}


def _normalize_board(board: str | None) -> str:
    return (board or 'cbse').strip().lower()


def get_chapters_by_class_subject(class_number, subject, board: str | None = None):
    normalized_board = _normalize_board(board)
    class_str = str(class_number)
    if normalized_board == 'rbse' and class_str in RBSE_CHAPTER_DATA:
        return RBSE_CHAPTER_DATA.get(class_str, {}).get(subject, [])
    if normalized_board == 'rbse' and class_str in ['6', '7', '8']:
        return get_cbse_chapters_by_class_subject(class_number, subject)
    return get_cbse_chapters_by_class_subject(class_number, subject)


def get_all_subjects_for_class(class_number, board: str | None = None):
    normalized_board = _normalize_board(board)
    class_str = str(class_number)
    if normalized_board == 'rbse' and class_str in RBSE_CHAPTER_DATA:
        return list(RBSE_CHAPTER_DATA.get(class_str, {}).keys())
    if normalized_board == 'rbse' and class_str in ['6', '7', '8']:
        return get_cbse_all_subjects_for_class(class_number)
    return get_cbse_all_subjects_for_class(class_number)


def get_chapter_details(class_number, subject, chapter_number, board: str | None = None):
    normalized_board = _normalize_board(board)
    class_str = str(class_number)
    if normalized_board == 'rbse' and class_str in RBSE_CHAPTER_DATA:
        chapters = RBSE_CHAPTER_DATA.get(class_str, {}).get(subject, [])
        for chapter in chapters:
            if chapter.get('chapter_number') == chapter_number:
                return chapter
        return None
    if normalized_board == 'rbse' and class_str in ['6', '7', '8']:
        return get_cbse_chapter_details(class_number, subject, chapter_number)
    return get_cbse_chapter_details(class_number, subject, chapter_number)
