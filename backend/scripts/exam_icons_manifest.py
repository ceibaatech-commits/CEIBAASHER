"""Manifest of custom Indian-perspective icons for every exam + skill drill
supported on Ceibaa. Keyed by a normalized alpha-numeric ID (uppercase,
non-alphanumeric → underscore) so the migration script can match records
regardless of the original casing / spacing.
"""

EXAM_ICONS = {
    # Defence
    "NDA": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/d327156635422c7d03cece70b914f0a94b91360b77c4a3f178b56cf943a5db73.png",
    "CDS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/6b05672c6a6ca7b742b269686e7ea30684fa04455c85229122d0c99c7d8f7020.png",
    "AFCAT": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/c8e04265f636f92bcff83fcfeb20f206c3019beb40d05b88fc5aa311af950e29.png",
    "TRADESMAN_AGNIVEER": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/c0385f819868c06549a1f9f3677a48efa9978ab9859e332afcee08bcd0c84243.png",
    "UPSC_CAPF_AC": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/a0a6d2cffdfe3654cfcc68b4bf62bb04c41160f15b18861242760b0c7d53bded.png",
    "AGNIVEER_ARMY": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/2a6b75ba75ceeded45590c63d2e598281837d719a829cb2153a599f8873fafb6.png",
    "AGNIVEER_NAVY": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/3f4c8efc36e9e89c14dc2bc7c14c75047503fc421db707bd0174dfb5da1f0e8e.png",
    "AGNIVEER_AIRFORCE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/4c55e18795cf5d3b12ca8d1d041374b816978c254b73c8c2051a33a9d91169dc.png",
    "INDIAN_COAST_GUARD": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/76bf0860054dda5320b2d233b9dfa5f5503a06f4f8170718ae9d3a7cc7841d8b.png",
    "TERRITORIAL_ARMY": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/818c5ad6e8ce9830b545181d083a68b6e99af557fc889cb245f326e1ec6e8162.png",
    # Banking
    "IBPS_PO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/93866d6f1349f0274acbea5aafbe9af3e3cd275f46b27aff32b49325d16eb690.png",
    "SBI_PO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/34e36eb8f5b77caa54926c590d484b112cfde3c2c4854eb3eeaa1eb6c15e1f25.png",
    "RBI_GRADE_B": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/87e7ae40bd87d9f1bd33cdef231c01156819330e01b29dd17ecebc4095ccac6f.png",
    "IBPS_CLERK": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/d0c52851e492c4682776141f640dcdb22ce1ea447a4422c223991447454e1446.png",
    "SBI_CLERK": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/8c01249c4327e638a13506b662e5a959c77ff4503fbb98857e075dd1b1f7b55b.png",
    "NABARD": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/019b1b594c586edacf59ac2df854ff0ed5712b218b0daa516b156adbfa15bf6f.png",
    # Civil Services
    "UPSC_CSE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/94fbaf44560228c7864e8f58e36380f95a8316724cb39cc56234961179d60405.png",
    "IAS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/f6e180a0cd166e17aae39c65f1abd450926ff5b4cd8b566b62ff1f2b6cdaff21.png",
    "IPS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/425889a4060c55ce71d8375bd975dc97ec12fba6154538f515a0425fc90defdc.png",
    "IFS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/ff3c09aefd61a0b564dcb5fac9b4f2fd3cc6893f90ac7e9400a275147d6e463d.png",
    "IRS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/a81782e620eb938a4070d3318e82b3fb5e5fd311f6e893ca7552162f268d6b00.png",
    "STATE_PSC": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/561c33b814f302553f1aa4b9b2e05754c62ca9582a42b3d343b3552541e7ca0c.png",
    # SSC
    "SSC_CGL": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/e931edaa0554884f9490dbbf332a816daee13c99cc65223029748c161ace0fbc.png",
    "SSC_CHSL": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/f227c5c797f280bbc5dd01dfa361d0d7470322e68fbb93eaca00cbce6c0768a8.png",
    "SSC_MTS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/e1287aff25532979f8923a88614e48073e40c2e04ceb317f969ecc66080754f2.png",
    "SSC_GD": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/005f4f47037769040b053cd15d6759cb195508c447c49d026f574bc5f6d8c075.png",
    "SSC_JE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/aa0fc60653cc8d817e32f0b660eebc2b9597cee4d1f27962d94ee408f5a6e30e.png",
    # Engineering
    "JEE_MAIN": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/44e93efd232852c84b0ea72cac1b79e1e34dca142c3dc4ab635ea77eac9ec360.png",
    "JEE_ADVANCED": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/7da435069b501d786841b56e24e2254104250499c1d6d7eb9c6728c067805b2c.png",
    "BITSAT": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/1f68fa31c7162fe293e4a9c44daa17c482be62bf0ac8fd3457bba4b7bcfcad79.png",
    "VITEEE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/e3147f7b668493884a2df1685de08e3a0d8fb34be77265d7adcd81f2a4d615fe.png",
    "GATE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/2b9bc76999f37a140592d172b60a2e87ed3efee465c3bab756aa2cfa3a398118.png",
    "WBJEE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/4a941b3137381d65e6298b03724085c5c09cfc4399febf490ac0911af11ee0d4.png",
    "MHT_CET": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/be72df20353845df1638f7d953dc88a7025070b24e7133c4808f87efdb0b5ff3.png",
    "KCET": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/c62535a1e122c9bedf545526f0d0c33ae68e0ec51aa92859568a4598a8d02793.png",
    "EAMCET": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/e85ab98ac9f892f69b45a04362bb37a3e4c165b04a3e079a7ea18de7b65e938e.png",
    "COMEDK": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/7956d9482d224986df8f13d53ce662a0a3470fd1593691ccbebbfa51d02e3827.png",
    # Medical
    "NEET": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/56b763c54edf410e4d46e1f19d9d239d15c8a0301947ba6dae6e6a387a403055.png",
    # Teaching
    "CTET": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/d99119e45981360f9cf34f4fc2a6af28a7487eeb7577fb6a2e079bb257466f18.png",
    # Railway
    "RRB_NTPC": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/da608cf5e4ee3fdca2e657d3882f5ea1d2c85521c206afdc59151d1f22bdd7e7.png",
    "RRB_GROUP_D": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/2b8576054c1668bb21d25c0b346ea36b1ce49b1fa35001ec2a2e703a5abedec2.png",
    "RRB_JE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/056df4563ad25b1c2a545770470273e0a8b59586f8f1e3f6faf428f3e3183c5a.png",
    "RRB_ALP": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/3cfc5d70757b4616fd30e35f663517660798467ecfbc1efb592b5556c2272fe0.png",
    "RPF_CONSTABLE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/54585e10fb0700e9e1fa753fe4cbab80655a44ef109c9cb46f032eb87a871848.png",
    # Insurance
    "LIC_AAO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/7ae05d1cefc8f4574e5e22c6d62a3e228687ac7236685646394cf90d19897e7e.png",
    "LIC_ADO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/aab668a0cd5080b1f4b3bbd6ec2cb865d3edd4d3a4d99a01c41a5f917ef4eaf3.png",
    "LIC_ASSISTANT": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/cdc39c3bca9a6bc80e4d5d6e1e56691eb8dbaa976bbaf35d10ea40a49ee56a26.png",
    "NIACL_AO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/26b8550ba9861301352ed0fa92fc5cb7b8d09822183da2783b108c685882f678.png",
    "UIIC_ASSISTANT": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/5f41f7fd18b8f59f408bf7596520f8c71e4d07594d7e8ac42f2c460634c2a80f.png",
    "EPFO": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/75b4072443c2c8616349ce30681997329792a27455ba906a284811913886cea5.png",
    # Boards
    "CBSE_6": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/59693db2cc2e4bd282cac2d1364318941ed3ec6d9305842b33857b13755e1084.png",
    "CBSE_7": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/e1e74c9a5df81d99cc9041a61a7d3a125970b9c901a3f14f7ba764b80ec531d1.png",
    "CBSE_8": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/78d2158d7b17e28787feb0bfa5a4fa0c5b259f8db01c6610dbfb6f74485df090.png",
    "CBSE_9": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/d3192c7204894fa5e27d0f9783865022e2b8e4e1fe2866be081a34c02abec109.png",
    "CBSE_10": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/3e7293632b669f4d5e24bcd986f8504689cb20d92888de42d106290e91d0dd46.png",
    "CBSE_11": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/92d585c937d00f3994086a412290708e3ef5b2f77c5fc346d1270e94e45a2b93.png",
    "CBSE_12": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/70e7568e354556dad0ab041509fa646f0259e673aed5d3b3e6ad3bc92c62ddf2.png",
    "ICSE_10": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/866d35b888946d9c59a7fe783d8ee0b7e45833363702a62d404cb6b160fdc268.png",
    "ISC_12": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/bf499fa1f023c6cb3414b640c9ecdb9400952c2efa8cb432753dc2b470823111.png",
    "NIOS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/30b9968a6f94c06e6788590f77eaa787bba445ca0fdd525022f5d917d04a1b08.png",
}

SKILL_DRILL_ICONS = {
    "APTITUDE": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/62b413dc1bae2108ab0be84e560190f4c30f2d690985d32ad20f8a160e17cabb.png",
    "REASONING": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/008c3169aec8998960b82b3a41b08bf6b4cc297cdd252811e9cf7e05b4b4b021.png",
    "ENGLISH": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/8f5c943c00a4882b93da8df5fdd76dfa19f3023fb4012f48a913c007cc5dd90e.png",
    "GK": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/d3565902d8d6e52b1a8b6e42ebd248a73c0466d6bdeb0ff9ae930ff1f73ee102.png",
    "COMPUTER": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/584d8fc92dcf643deaa870c7f342399d9a1bab0e68d0ce5ebd00f88a2a527dce.png",
    "CURRENT_AFFAIRS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/456a0985bce15aff1012fb323e662d30c11411f70de390e689c32f0bd2a38dda.png",
    "VERBAL": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/a8635c8c2faea254d04267b4e0bab0a089f311c9cf4ac1fb35de1e2b0e941549.png",
    "QUANT": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/414ad7280a924dd2f2783bd46bcfcccd24b5f14be0eabcc1f8e6025322a45eb8.png",
    "DATA_INTERPRETATION": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/5853ed50131d1720b60a362280d4557a8dcde6d80d95f164b2b2be892403bd66.png",
    "GENERAL_AWARENESS": "https://static.prod-images.emergentagent.com/jobs/67659974-9055-4403-8d21-dc988f87a583/images/2f35b5fef20f31ae946d38bbbb4f699cdecc266d2c10f4ee0b08776f2335981f.png",
}
