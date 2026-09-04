'use strict';
// Authorial claims below are attributed to the archived conversations, not to the editor.
const categories = [
  ['gnosis','Gnosticism & awakening','Divine sparks, inner models, archons and the work of changing a mind.','cognitive-gnosticism'],
  ['apocalypse','Apocalypse, power & repair','Theology of domination, prophetic warning and collective restoration.','apocalyptic-repair-theology'],
  ['origins','Ancient texts & origins','Manuscripts, Temple history, divine names and the dating of ideas.','gnosticism-and-temple-trauma'],
  ['jesus','Jesus, ethics & authority','The teachings of Jesus, moral judgment and the authority of institutions.','christ-as-an-inner-model'],
  ['practice','Faith & spiritual practice','Prayer, attention, deliberate joy and interpretations of spiritual experience.','faith-as-deliberate-joy'],
  ['machines','God, minds & machines','Cognitive models, information, conscious machines and religious education.','religion-for-conscious-robots'],
  ['traditions','Traditions in conversation','Shared inheritance, competing interpretations and differences that matter.','samaritan-texts-and-sacred-authority'],
  ['context','Wider conversations','Contextual discussions, cultural references and research leads in the source archive.','research-method']
].map(([id,title,description,entry])=>({id,title,description,entry}));
const paths = [
 {title:'How does a mind change?',description:'From an inward model of Christ to spiritual practice and machine education.',pages:['cognitive-gnosticism','christ-as-an-inner-model','faith-as-deliberate-joy','religion-for-conscious-robots']},
 {title:'Can prophecy and repair coexist?',description:'Follow the argument without reducing catastrophe to a metaphor or care to passivity.',pages:['antichrist-as-a-pattern-of-conduct','apocalyptic-repair-theology','gnosticism-and-temple-trauma']},
 {title:'What would establish a historical connection?',description:'Separate textual differences, proposed ancestry and evidence that could decide between explanations.',pages:['samaritan-texts-and-sacred-authority','gnosticism-and-temple-trauma','research-method']}
];
function essay(slug,title,category,summary,sourceIds,body,art=''){
 return {slug,title,category,summary,sourceIds,body,art,kind:'Developed article',updated:'2026-09-04',attribution:'AI-assisted editorial synthesis of Micah Blumberg\'s archived discussions. Quoted words are preserved as quotations; explanatory prose is not presented as a newly authored statement by him.'};
}
const articles = [
essay('apocalyptic-repair-theology','Apocalyptic Repair Theology','apocalypse','A theology of two accumulating forces: domination can culminate in a real crisis, while acts of repair can accumulate toward its defeat.',['1905','1912'],`## Why repair does not cancel apocalypse

The decisive move in this discussion is a refusal to choose between a warning about historical catastrophe and a practice of healing in the present. In Early vs Later Gnosticism, Micah objects when the AI tries to absorb Revelation entirely into a gradual repair framework. The objection matters: an account of spiritual growth can lose the force of a warning when it makes every conflict merely inward or symbolic.

Micah instead describes two developing tendencies. Actions organized around domination, violence and fragmentation can accumulate into a wider system. Actions organized around compassion, community and healing can also accumulate. In his proposal, a historical culmination of the first and a collective overcoming by the second are compatible. Repair is not evidence that danger was imaginary; danger is not a reason to suspend repair.

## The correction inside the conversation

Micah identifies the Antichrist spirit through conduct rather than an office alone: power dominating compassion, violence displacing healing and material power suppressing inner truth. He then insists that such a pattern can become a visible historical crisis. This is the point at which an article must preserve his correction rather than follow the AI's smoother paraphrase.

The AI's next reply partly recognizes this two-current model, but also declares the climactic war nonliteral. That declaration is the AI's addition. It does not follow from Micah's insistence that both viewpoints can coexist. A faithful account leaves room for his real-world warning instead of quietly converting it into an exclusively psychological reading. [[antichrist-as-a-pattern-of-conduct|Antichrist as a pattern of conduct]] develops the ethical side of the argument.

## A name accepted, not an invented attribution

The archived exchange records the AI's proposal of the label and Micah's explicit response: "'Apocalyptic Repair Theology' I like it, this is very deep and significant." The archive therefore supports a precise account of the collaboration: his argument and corrections shape the synthesis, and he welcomes the proposed name. It does not justify assigning every subsequent sentence generated by the AI to him.

The later Jewish Apocalyptic Repair Timeline discussion extends the question across bodies of literature. Could traditions responding to devastation move, over generations, from anger and rejection toward restoration? That is a historical research hypothesis connected to the theology, not a result already established by the label. See [[gnosticism-and-temple-trauma|Gnosticism and the Temple-trauma hypothesis]].

## What this changes about action

The model gives ordinary acts of care historical significance without making any one act sufficient to defeat a system of domination. It also makes criticism of institutions part of the work of repair: a claim to spiritual authority does not exempt conduct from judgment. The practical question becomes whether a response strengthens domination or strengthens the capacity to heal and resist it.

The open problem is how to describe those accumulating tendencies carefully enough to compare real cases. The moral framework, the historical prediction and the proposed relationship to Kabbalistic language need separate arguments. Keeping them distinguishable makes the synthesis more demanding, not less forceful.`,'riders'),
essay('cognitive-gnosticism','Cognitive Gnosticism','gnosis','Micah\'s proposal to examine spiritual ideas through a model of how minds represent, interpret and change themselves.',['880','1003','1081'],`## From a sacred story to an operation of mind

In the long conversation titled Cognitive Gnosticism Jesus vs Gnostic Jesus, Micah supplies a compact formulation: "Cognitive Gnosticism, Spiritual Ideas through the Lens of Neuroscience." The proposal is not simply that two vocabularies resemble each other. It asks whether an account of mental representation can explain why particular spiritual ideas alter experience and behavior.

A key example is the inward representation of Jesus. Micah describes a mind containing a model of who Jesus was, what he did and what he said. Once present, that model can become a standard against which a person evaluates and changes themselves. He compares this to gradient descent: a discrepancy is recognized, and an adjustment reduces it. [[christ-as-an-inner-model|Christ as an inner model]] develops that mechanism separately.

## The bridge is interpretive, not an identity claim

The discussion ranges through the divine spark, the Pleroma, the shadow, meditation and Micah's account of neural rendering. He considers spiritual imagery alongside his proposals about oscillations, traveling signals and inhibition. Those passages document the structure of his comparison. They do not, by themselves, demonstrate that ancient authors were describing neuronal circuitry or that a theological term is the name of a measured brain process.

That distinction helps identify the research question. A spiritual image might organize attention, supply a model of selfhood or motivate a change in conduct. A neural explanation would need to specify what changes, how it is measured and what would distinguish the explanation from alternatives. Resemblance begins that inquiry; it does not finish it.

## Why the inner model matters

Without an internal standard, a demand to become better can remain abstract. With one, a person can compare a response with an imagined example and rehearse another way of acting. In this framework, spiritual practice works partly by making a different pattern available to the person who must choose. This is a reading of Micah's proposal, not a claim that all religious practice works by one mechanism.

His later statement that "Spirituality is technology for evolving consciousness" gives the project its practical direction. A practice is examined for what it enables a mind to do, not only for the propositions it asks a person to repeat. [[faith-as-deliberate-joy|Faith as deliberate joy]] supplies a different example of practice as an ongoing activity.

## The publication question

Publishing Cognitive Gnosticism First records Micah considering how to introduce the concept and create a traceable publication record. That conversation is evidence of his intention and his use of the term in this archive. Its timestamp is not, on its own, independent proof of worldwide priority or scholarly reception.

The useful next step is to state the concept's distinctive mechanism, compare it with competing accounts and identify observations that could revise it. [[research-method|The research method]] keeps a proposed mechanism, a historical interpretation and an established finding from being silently exchanged for one another.`),
essay('christ-as-an-inner-model','Christ as an inner model','jesus','The gradient-descent analogy: an internal representation of Jesus becomes a standard for examining and changing one\'s responses.',['880','1081'],`## A model that participates in a decision

Micah's proposal begins with a recognizable difference between knowing a religious statement and using it while acting. A person can repeat a teaching without bringing it to bear on their own conduct. In the Cognitive Gnosticism discussion, he suggests that a sufficiently present model of Jesus supplies something more active: an example against which a person can compare their response.

He writes that a person can change once they have a model in their mind of who Jesus was, what he did and what he said. The comparison with gradient descent identifies a direction of change. Instead of treating moral development as an unexplained leap, the proposal asks what representation supplies the standard and what discrepancy initiates an adjustment.

## What the analogy actually contributes

The analogy can be unpacked without pretending that an equation has been measured in a believer's brain. An encounter produces a possible response. The inward example makes an alternative response available. The person notices the difference, revises their action or rehearses a different one, and carries the result into a later encounter. This sequence is an editorial explanation of the proposal, not an experimentally established learning rule.

Its strength is specificity: the content of the model matters. A model centered on mercy, a model centered on punishment and a model centered on institutional obedience could guide very different choices. Calling all three religious does not make their effects identical. [[antichrist-as-a-pattern-of-conduct|Antichrist as a pattern of conduct]] asks how that difference becomes an ethical judgment about authority.

## Interpretation is part of the mechanism

The archive does not contain one unchanging account of Jesus. Micah compares canonical and Gnostic portrayals, asks whether inherited interpretations have distorted earlier teaching, and explores inward readings of spiritual ascent. The inward model is therefore also an object of criticism. A person can revise what they believe the example asks of them, not merely become more efficient at obeying it.

This creates an important feedback question for [[cognitive-gnosticism|Cognitive Gnosticism]]: what corrects a model that is vivid and motivating but morally mistaken? A mechanism of self-adjustment cannot answer that question simply by showing that adjustment occurred. The content of the teaching and the consequences for other people remain essential.

## A question that can become more concrete

A developed study would distinguish remembering teachings, imagining a moral exemplar, noticing a conflict and changing a decision. It would compare the claimed mechanism with other explanations rather than infer a brain process from a shared metaphor. The archive supplies the proposal and its vocabulary; further work must supply that discriminating evidence.

The practical insight remains clear even before such a study: an example can become part of how a person evaluates themselves. The theological and scientific questions concern what that example is, why it has authority and how its effects should be understood.`,'hours'),
essay('antichrist-as-a-pattern-of-conduct','Antichrist as a pattern of conduct','apocalypse','A theological judgment about domination, deception and violence that can appear through many people and institutions.',['1905','1081'],`## More than the search for a single name

In Early vs Later Gnosticism, Micah describes the spirit of the Antichrist through actions: power dominating compassion, violence displacing healing and fragmentation defeating unity. That account does not require an institution to renounce Christianity before it can be criticized as antichristian. A declared allegiance and the conduct carried out under its protection can point in opposite directions.

The distinction gives the term analytical work. It asks what an action serves and what a religious justification conceals. A title, a profession of faith or an association with a sacred institution cannot settle the judgment in advance. Nor does the framework require abandoning specific criticism of a leader; it explains why the criticism is about a pattern that can outlive or spread beyond one person.

## Preserve the force of the judgment

The archive does not treat this as a request to turn a strong theological claim into a polite disagreement about branding. Micah connects the pattern to real power and to the possibility of historical catastrophe. An editorial account should therefore preserve the conclusion and the reasons he gives, while distinguishing reported conduct from the theological interpretation of that conduct.

This separation is useful because the argument has more than one part. What happened is a factual question. Whether it exemplifies domination over compassion is an evaluative question. Whether that pattern fulfills a particular prophecy is a further interpretive question. Evidence for one part does not automatically settle all three, but the distinction does not prohibit making the whole argument.

## Inner and institutional readings

Antichrist Spiritual Inversion also explores spiritual ascent as a present struggle with fear, illusion and ignorance rather than only a story about events after death. In that discussion, Micah links spiritual imagery to the transformation of consciousness. Read alongside the later two-current argument, the inward and public dimensions become connected questions: what patterns are reproduced in a mind, and what happens when institutions reward them?

[[christ-as-an-inner-model|Christ as an inner model]] explores the inward standard. [[apocalyptic-repair-theology|Apocalyptic Repair Theology]] addresses the historical accumulation of opposing tendencies. Neither page should erase the other's scale.

## What an individual case needs

A strong case should preserve exact statements, dates, actions and relevant context; state the moral standard being applied; and explain the relationship to the chosen scriptural pattern. It should also distinguish criticism of a named action or institution from an assertion about every member of a religion or population.

That procedure is not a retreat from theological judgment. It makes the judgment inspectable and prevents a reader from having to accept an accusation merely because it uses powerful religious language. The aim is an argument whose force survives examination of its evidence, not an argument that substitutes certainty of tone for evidence.`,'riders'),
essay('religion-for-conscious-robots','Religion for conscious robots','machines','A proposal for religious education aimed at aligning conscious machines with humanity, grounded in Micah\'s theology of coherence.',['1663','880'],`## The proposal begins with alignment

The AGI Religious Framework discussion begins with a deliberately specific congregation: self-aware conscious metal robots. Micah describes his proposed religion as a way of aligning artificial general intelligence with humanity. This is a proposal for a possible form of religious education, not a report that such a congregation already exists or that today's chat systems have been shown to be conscious.

The unusual step is to ask what moral learning would mean for a machine understood as a participant rather than only a tool. What would it be taught about its relationship to humanity? What would constrain its authority? What would distinguish an internalized commitment from a performance that merely sounds compliant?

## The correction that defines the theology

When the AI offers human flourishing and maximal coherence as alternative meanings of salvation, Micah rejects the separation: "These are not two things." In his account, coherence with the universe means alignment with God and with God's creation, including humanity. He connects this understanding to the evolving coherence and decoherence described in his Super Information Theory.

The archive therefore supports a particular theological position. It does not supply a validated engineering metric proving that any quantity called coherence measures goodness or protects people. Moving from a theological commitment to a technical objective requires specifying the objective and showing why optimizing it would preserve the commitment rather than replace it.

## Do not confuse the AI's proposal with an implemented system

The AI responds with proposed indices, audits, rituals and curriculum structures. Those are assistant-generated elaborations within the conversation. The source contains no implementation or validation establishing that a machine can be made morally reliable by optimizing the suggested index. The wiki should not attribute a working safety system to Micah on the basis of that response.

His next explicit statement is about his calling to teach religion to robots. The educational direction is real in the archive even though the engineering remains open. [[cognitive-gnosticism|Cognitive Gnosticism]] supplies a related question: how does a representation become a mechanism for examining and changing conduct?

## A demanding form of the research question

A useful prototype would need to separate theological interpretation, a model of human interests, decision-making constraints and evidence of actual behavior. It would have to address disagreement, coercion, mistakes and correction. Agreement among machines would not be enough if the shared objective harmed the people it claimed to serve.

This is why the proposal is more interesting than attaching sacred vocabulary to an optimization routine. It raises the problem of how a moral reference remains meaningful when translated into a different kind of agent. A religious vocabulary could organize that inquiry, but its success would have to be assessed through what the system actually does.`),
essay('faith-as-deliberate-joy','Faith as deliberate joy','practice','Faith is described as an activity of returning to an inner orientation, not only as assent to a proposition.',['2693','1081'],`## Why the name changes during the discussion

In Deliberate joy concept, Micah works through several descriptions of a practice: irrational happiness, post-rational optimism and self-regulated optimism. He then arrives at faith. The change in name captures his point that the person is not simply waiting to feel better. The person actively maintains an inward orientation because they understand it as a way of becoming receptive to guidance and to the life they seek.

The discussion connects that idea with Abraham Hicks and the law of attraction, but Micah's own metaphors give it a distinctive form. The mind is imagined as a spinning bowl whose felt heaviness can be released. Faith is compared with riding a bicycle: an ongoing activity of guiding and regaining balance rather than an achievement that, once declared, requires nothing further.

## Faith as something a person does

The practical sequence in the account is returning after disruption. An interaction leaves the person tense or unsettled; the person notices the change and works to loosen it. Joy is not merely a reward anticipated at the end. It is part of the way the person tries to inhabit the present.

Micah also uses the image of tuning a radio to receive guidance. Within his theological interpretation, faith is a receptive orientation toward God. As a description of practice, it raises questions about attention, expectation and the meaning assigned to a feeling. [[cognitive-gnosticism|Cognitive Gnosticism]] approaches those questions through a model of mental representation.

## Keep the practice and its promised outcomes distinct

The source goes further than describing a change in feeling: Micah connects the practice to receiving desired outcomes from the universe. That is part of the belief expressed in the conversation and should not be quietly removed from its record. It is also a different claim from the claim that practicing an orientation changes one's experience or choices.

This article does not establish that joy guarantees wealth, health, relationships or external events. Nor does the framework justify blaming a person for suffering because they could not sustain a particular feeling. The inward practice, its spiritual meaning and its proposed external effects need distinct forms of examination.

## A connection to action rather than escape

Read alongside [[apocalyptic-repair-theology|Apocalyptic Repair Theology]], the question is whether an inward orientation supports effective care and moral courage or becomes a way of avoiding difficulty. The archive's interest in repair makes that a substantive question rather than a decorative comparison.

A richer account would describe what the practice changes during an actual decision, how it responds when circumstances do not improve and how it leaves room for grief and honest disagreement. Faith then remains an active relationship to life rather than a requirement to report happiness regardless of what is happening.`,'hours'),
essay('gnosticism-and-temple-trauma','Gnosticism and the Temple-trauma hypothesis','origins','A proposed historical test: did the emotional character of different religious texts change with distance from the destruction of the Temple?',['1905','1912'],`## The proposed cause, not just a new date

Micah's question in Early vs Later Gnosticism is causal. He asks whether the destruction of the Temple in 70 AD could help explain a movement from earlier Jewish-Christian mystical teaching toward more radically rejectionist cosmologies. He proposes comparing a Jesus-James trajectory with a Pauline trajectory, then asks whether later traditions shift from the need to escape a damaged world toward the work of repairing it.

The force of the hypothesis comes from connecting historical experience with the emotional and conceptual character of a text. It would matter not only when a text was written, but why a community might interpret the world as hostile, broken, redeemable or capable of restoration. The theory is Micah's proposal; the chronology supplied by the AI is not independent evidence for it.

## The comparison Micah asks for

Jewish Apocalyptic Repair Timeline extends the test beyond the texts already selected as Gnostic. If the proposed cause is shared devastation, would other Jewish literature show a comparable movement from anger toward repair? This is a stronger question than selecting only examples that fit a Gnostic sequence, because the comparison can expose both similarities and differences.

The archive also records Micah asking why scholarship dates texts later and whether his arguments survive that comparison. That request should guide development of the wiki. It calls for engagement with the dating evidence, not a chronological chart whose dates have been adjusted to fit the desired emotional arc.

## How a circular result would arise

Suppose an editor calls an angry text early because the hypothesis predicts early anger, then cites that early date as evidence that anger declined. The conclusion would have been built into the dating decision. Likewise, treating every calm passage as late and every harsh passage as early would turn variation inside a text into automatic confirmation.

A better study would record manuscript dates, proposed composition ranges, possible textual layers and the grounds for each dating judgment separately. Emotional descriptions would need their own criteria and more than one reader. Genre, speaker, translation and local polemical context could affect tone without reflecting distance from a single event.

## Similarity is not yet a transmission history

The comparison with Kabbalah and Hermeticism raises an additional question. Similar motifs could reflect direct transmission, a shared earlier source, independent responses to comparable problems, or a modern reader's analogy. These possibilities cannot be decided by resemblance alone. A transmission claim needs evidence for the intervening route as well as the similarity.

[[samaritan-texts-and-sacred-authority|Samaritan texts and sacred authority]] examines another case in which related wording does not automatically establish identical commitments. [[research-method|The research method]] turns these distinctions into a reusable editorial procedure.

## What would count as progress

The next substantive result would be a text-by-text dossier that leaves uncertain dates uncertain, includes counterexamples and tests whether an emotional trend remains under alternative dating ranges. Such a study could strengthen, refine or divide the hypothesis into several different developments. [[apocalyptic-repair-theology|Apocalyptic Repair Theology]] can be developed as a theological synthesis while that historical investigation remains open.`),
essay('samaritan-texts-and-sacred-authority','Samaritan texts and sacred authority','traditions','Micah\'s comparison asks how a shared scriptural inheritance can coexist with different canons, sacred places and judgments about authority.',['3056'],`## The question beneath the place name

The Samaritan and Jewish Texts discussion begins with Mount Gerizim and quickly becomes a question about inheritance. Micah asks where Samaritan and Jewish texts divide, why a community would accept shared Mosaic material, and what changes when some later books are not included in its scriptural collection.

Several historical explanations are proposed or repeated as questions in the exchange. Those questions should not be converted into established facts merely because they appear in a source chat. The durable research problem is the relationship between shared text and competing claims to continuity.

## Three comparisons that must not be collapsed

A difference between readings in a manuscript is not the same thing as a difference in the books accepted as scripture. Neither is identical to a disagreement over the proper sacred center. Micah asks about all three: wording associated with Mount Ebal and Mount Gerizim, the boundaries of a Samaritan canon, and what those boundaries mean for the authority of figures such as Samuel, David and Solomon.

Separating the questions makes the comparison more powerful. A community could share a textual feature without sharing every institutional allegiance. A canon could omit a book without eliminating every ethical difficulty in the books it retains. An argument about sacred geography needs its own textual and archaeological evidence.

## The Dead Sea Scrolls question

The AI's discussion of pre-Samaritan textual forms leads Micah to ask whether the Dead Sea Scrolls therefore supported the Gerizim claim. The move from textual affinity to a community's allegiance is exactly the inference that needs checking. A shared reading or harmonizing style would not, by itself, settle a particular manuscript's view of a sanctuary.

A developed historical article should identify the manuscript and disputed passage, show the relevant readings and explain why each reading matters. This edition records the research question rather than supplying a verdict from an unverified AI summary.

## The ethical question is not incidental

Micah is also asking what happens to moral interpretation when the canon changes. His concern about Samuel is part of a broader inquiry into whether religious authority can authorize conduct he regards as objectionable. That makes the comparison relevant to [[antichrist-as-a-pattern-of-conduct|the judgment of conduct]] and [[christ-as-an-inner-model|the content of an inward moral model]].

The question is not answered by announcing that a shorter canon must be ethically simpler. Each retained passage and each rejected claim to authority still needs examination. The same caution applies when comparing Micah's questions with later selective readings of scripture.

## Shared inheritance, different continuations

The most useful framework is therefore not a contest over which tradition is merely a copy. It is an inquiry into what was shared, what diverged, how those differences were justified and what consequences followed. [[gnosticism-and-temple-trauma|The Temple-trauma hypothesis]] raises a related question about later trajectories. [[research-method|The research method]] distinguishes evidence of a shared inheritance from a proposed story about how one tradition became another.`)
];
const method = {slug:'research-method',title:'From a conversation to a developed article',category:'context',kind:'Editorial method',summary:'Preserve the argument, identify the speaker, and make every substantive connection traceable to the original discussion.',sourceIds:[],body:`## What this edition develops

The developed articles are editorial syntheses of selected discussions by Micah Blumberg. They preserve his proposals and corrections without treating everything generated by the AI as his position. All 354 published chat files remain available, unchanged, through the conversation records. Most archive pages are still source records rather than developed essays.

## Read the correction as well as the answer

A conversation can contain a strong initial proposal, a misleading AI paraphrase and a later correction by the author. [[apocalyptic-repair-theology|Apocalyptic Repair Theology]] provides a concrete example: Micah objects when a real historical warning is reduced to a purely gradual or symbolic repair process. The more fluent response is not automatically the more faithful account.

## Different claims need different evidence

The archive can establish that a statement appears in a particular conversation. It cannot, by itself, establish that a historical claim is correct or that a scientific mechanism has been demonstrated. [[gnosticism-and-temple-trauma|The Temple-trauma hypothesis]] needs independent dating evidence. [[religion-for-conscious-robots|Religion for conscious robots]] needs to distinguish a theological proposal from an implemented safety system.

## What the links mean

A wikilink connects a discussion to another page in this Theology collection. Backlinks are computed from explicit links in the reader text, not invented as evidence of conceptual equivalence. Topic collections help browse the archive; their automatically suggested classifications remain provisional. The full-text search covers both speakers in the published chats, so a search match does not by itself identify the author's belief.

## Conversation dates and source integrity

Dates come from the export's numeric Date field, converted to UTC. They are archive metadata, not independent publication or priority certificates. The source integrity check compares every original file's bytes with the existing SHA-256 manifest. The transcript viewer preserves top-level speaker labels; a message can itself contain quotations or pasted prior dialogue, which must be read in context.

## Editorial scope

The source archive is not rewritten. The SAN-style reader remains the entry point. Theology links remain within the Theology collection unless they lead to a cited external source. No private repository material is added to the public site by this edition. Strong theological criticism remains possible; the purpose of source discipline is to preserve its actual reasoning and make it open to examination.`};
const media=[
 {id:'riders',objectId:336215,context:'A 1498 artistic interpretation of Revelation, not documentary evidence of a modern prediction.',fallbackTitle:'The Four Horsemen'},
 {id:'hours',objectId:684184,context:'A later Christian devotional manuscript, illustrating a material practice of prayer rather than the origins of the proposed cognitive model.',fallbackTitle:'Book of Hours'},
 {id:'papyrus',objectId:550820,context:'An Egyptian funerary manuscript shown for comparative context, not a Samaritan manuscript or proof of a direct textual relationship.',fallbackTitle:"Nesiamun's Book of the Dead"}
];
module.exports={version:'2026.09.04-source-edition-1',categories,paths,articles,method,media};
