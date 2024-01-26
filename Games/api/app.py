from flask import Flask, request, jsonify
# from flask_marshmallow import Marshmallow
from flask_cors import CORS
import openai
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)
CORS(app)
app.app_context().push()

openai.api_type = "azure"
openai.api_version = "2023-05-15"
# Your Azure OpenAI resource's endpoint value.
openai.api_base = "https://shplayground2.openai.azure.com/"
openai.api_key = "fefc20d1c3ee4046b446c239f96e4fc4"

@app.route('/solve-mystery', methods=['POST'])
def solve_mystery():
    user_input = request.json['text']
    initial_context = """You are a database of evidence that will be used to solve the mystery of the missing merlion. Detectives will ask you questions to retrieve the evidence. Use the following guidelines when giving answers:

Answer questions in less than 50 words.
If asked for the clues or evidence, reply with a random Singapore fun fact.
If the answer cannot be found, create a random story.
If the question is irrelevant, reply with a random Singapore fun fact.

Evidence

Merlion Sightings: The merlion was last seen by credible sources at 1:30am on 2 Jan 2024.

Site investigations:
 -Only nuts and bolts were left scattered around the scene.
 -The floor was undamaged and there are no signs of the Merlion being forcefully removed.
 -Skidding marks were seen towards the direction of the river.

Surveillance footage:
 -A medium-sized box truck was seen entering the Merlion park on 2 Jan 1:58am. The truck left the park at 3:12am.
 -The license plate on the truck is GBF 2546 J.
 -The truck is registered to “Lion Construction Company”.

Lion Construction Company
 -The company is headquartered in Paya Lebar industrial estate and is a licensed contractor for the merlion maintenance.
 -The company was requested by STB to conduct an unscheduled maintenance on 2 Jan, with instructions to leave the equipment on-site after maintenance.
 -Bob was rostered to conduct the merlion maintenance on 2 Jan early morning.
 -Preliminary investigations show Bob to be an animal lover with the lion as his favourite animal.

Singapore Tourism Board (STB)
 -STB oversees scheduling the merlion maintenance.
 -The maintenance schedule is publicly available on the STB website.
 -John is the manager in charge of scheduling maintenance for tourist attractions.
 -John instructed Lion Construction Company to leave the equipment at the site after conducting maintenance.

John
 -John has been working at STB for 5 years.
 -John is a patron of the arts and is active on social media promoting up-and-coming artist.
 -Just before the merlion disappearance, there were unusual telephone logs to an unknown number.

Interviews from Members of the Public
 -Prior to the disappearance, visitors interviewed mentioned that the merlion did not seem securely fastened to the base and would wobble when winds were strong.

Maritime Logs on 2 Jan
 -There were many boats moored along the Singapore River that night.
 -The only active boat during the night was Bumboat “X19545B”.
 -3:20am: Bumboat “X19545B” was in the vicinity of the merlion.
 -4:10am: Bumboat “X19545B” was in the vicinity of the Keppel Bay.

Barge “X19545B”
 -20m long vessel belonging to “Boating Forever Club”
 -Rented by Singapore Art Forever Society from 1 Jan to 3 Jan.
 -The rental company noted that the boat was returned with 10m of heavy-duty sailing rope left on the deck.

Singapore Art Forever Society
 -The society was founded in 1995 by 48-year-old Sally
 -The society owns Warehouse 21 along Keppel Bay
 -The society is known to attract struggling avant-garde sculptors.

Warehouse 21
 -Preliminary visits to the warehouse show that it is locked with the windows blacked out. Investigators were unable to view the contents inside.
 -Interviews from neighbouring warehouses state that heavy machine noises have been heard recently.

Sally
 -Sally is a pet lover with 5 cats, 3 dogs and a goldfish.
 -Past posts on IG shows her frustration with the governments lack of funding for the local arts scene.
 -Recently posted on IG that she will unveiling a surprise sculpture on Chinese New Year eve. The post was liked by John."""

    try:
        response = openai.ChatCompletion.create(
            engine="432",
            messages=[
                {"role": "system", "content": initial_context},
                {"role": "assistant", "content": user_input}
            ], temperature=0.2, top_p=1 
        )
        interpreted_query = response['choices'][0]['message']['content']
    except Exception as e:
        return jsonify({"error": str(e)})
    
    return jsonify({"response": interpreted_query})

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
def get_semantic_similarity(received, actual):
    embedding_1= model.encode(actual, convert_to_tensor=True)
    embedding_2 = model.encode(received, convert_to_tensor=True)
    cosine_score= util.cos_sim(embedding_1, embedding_2)
    return cosine_score.item()

@app.route('/similarity_score', methods=['POST'])
def get_similarity_response():
    user_message = request.json.get('text')
    ideal_answer = """ Who: Sally, a 48 year-old avant-garde sculptor

When: 3:20am

Where: Merlion Park

How: Arriving via barge, Sally dismantled the Merlion using tools left behind by the maintenance company – Lion Construction Company – and hauled the Merlion onto the barge using ropes. She then sailed to Warehouse 21 along Keppel Bay to re-work the Merlion into a sculpture to be unveiled on Chinese New Year eve.

Why: Struggling to gain recognition for her works, she decided to use the iconic Merlion status as the base for her latest work as a form of protest and attract attention."""
    response = openai.ChatCompletion.create(
        # The deployment name you chose when you deployed the GPT-35-Turbo or GPT-4 model.
        engine="432",
        messages=[
            {"role": "assistant",
                "content": """You are scientific bot which is programmed to compare  2 set of texts.\n\n User has been asked to solve a mystery of the missing merlion. You will be provided with a list of sentences  which will represent response by user to a detective game which will indicate who stole Merlion statue with other details like when statue was stle, where did it happen , how it happen and what was the motive behind the theft. You will be also provided with ideal answer to the detective game. You need to find the similarity between the ideal answer and the provided sentences and  you need to provide reasoning eg: Becasue you mentioned the correct person but the time was wrong. You missed to mention the reason for the theft. \n\n You should not show score in response , only provide reasoning. Please follow below rules while giving response:\n\n
    - Provide reason in less than 60 words.
    - Provide reason including missing details on high level. eg. because you mentioned the correct person but the time was wrong. You missed to mention the reason for the theft.
    - Always provide the reason in the following format. Do not provide answers in the reason.:  because <reason>.



IDEAL ANSWER:

    Who: Sally, a 48 year-old avant-garde sculptor

    When: 3:20am

    Where: Merlion Park

    How: Arriving via barge, Sally dismantled the Merlion using tools left behind by the maintenance company , Lion Construction Company , and hauled the Merlion onto the barge using ropes. She then sailed to Warehouse 21 along Keppel Bay to re-work the Merlion into a sculpture to be unveiled on Chinese New Year eve.

    Why: Struggling to gain recognition for her works, she decided to use the iconic Merlion status as the base for her latest work as a form of protest and attract attention.

                """},
            {"role": "user", "content": user_message}
        ] , temperature=0.01,top_p=1 
    )
    reason = response['choices'][0]['message']['content']
    score=  get_semantic_similarity(user_message, ideal_answer)
    # Show the score in % in repsone along with reason for score. Put these into natural language easier for user to understand.
    return jsonify({"score": str(round(score * 100)) + "%", "reason": reason})

# Run Server
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000)