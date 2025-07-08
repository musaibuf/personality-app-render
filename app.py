import streamlit as st
import plotly.graph_objects as go
from datetime import datetime
import gspread
import json
import os
from PIL import Image

# --- PAGE CONFIGURATION ---
try:
    logo = Image.open("logo.png")
except FileNotFoundError:
    logo = "🧠" 

st.set_page_config(
    page_title="Carnelian - Personality Style Assessment",
    page_icon=logo,
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- CUSTOM CSS ---
st.markdown("""
<style>
    #MainMenu, footer, header {visibility: hidden;}
    body { background-color: #FFFFFF !important; color: #2c3e50 !important; }
    .welcome-container, .results-container, .question-container { padding: 2rem; margin: 2rem auto; border-radius: 15px; background-color: #f8f9fa; border: 1px solid #e9ecef; max-width: 800px; }
    .main-header { font-size: 2.2rem !important; text-align: center; margin-bottom: 1rem; color: #1f77b4; font-weight: 700; }
    .question-number { font-size: 1.1rem; font-weight: 600; color: #1f77b4; padding-bottom: 0.5rem; border-bottom: 2px solid #e9ecef; margin-bottom: 1rem; }
    .question-title { font-weight: bold; margin-bottom: 1rem; color: #2c3e50; font-size: 1.1rem; }
    .score-highlight { font-size: 1.5rem; font-weight: bold; color: #1f77b4; text-align: center; margin-bottom: 1rem; }
    .stRadio > div { gap: 0.5rem; }
    .stRadio label { display: flex; align-items: center; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid #e9ecef; background-color: #FFFFFF; transition: all 0.2s ease-in-out; }
    .stRadio label:hover { border-color: #1f77b4; background-color: #f0f8ff; }
    .stRadio label > div { color: #2c3e50 !important; }
    .keyword-banner { text-align: center; background-color: rgba(31, 119, 180, 0.1); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-style: italic; }
    
    .results-column h5 {
        color: #1f77b4;
        font-weight: 600;
        border-bottom: 2px solid #1f77b4;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
    }
    .results-column ul {
        list-style-type: none;
        padding-left: 0;
    }
    .results-column li {
        margin-bottom: 0.75rem;
        line-height: 1.5;
        padding-left: 2rem;
        position: relative;
    }
    .results-column li::before {
        position: absolute;
        left: 0;
        top: 0;
    }
    .results-column .behaviors li::before {
        content: '✅';
    }
    .results-column .tips li::before {
        content: '💡';
    }

    @media (max-width: 768px) {
        .main-header { font-size: 1.8rem !important; }
        .welcome-container, .results-container, .question-container { padding: 1.5rem; }
        .question-title { font-size: 1rem; }
        .results-column { margin-bottom: 1.5rem; }
    }
</style>
""", unsafe_allow_html=True)


# --- DATA (Questions, Scoring, Descriptions) ---
# (Data is unchanged)
questions = [
    {
        'text': 'When talking to a customer…',
        'choices': [
            'I maintain eye contact the whole time. (Driver)',
            'I alternate between looking at the person and looking down. (Amiable)',
            'I look around the room a good deal of the time. (Analytical)',
            'I try to maintain eye contact but look away from time to time. (Expressive)'
        ]
    },
    {
        'text': 'If I have an important decision to make…',
        'choices': [
            'I think it through completely before deciding. (Analytical)',
            'I go with my gut feelings. (Driver)',
            'I consider the impact it will have on other people before deciding. (Amiable)',
            'I run it by someone whose opinion I respect before deciding. (Expressive)'
        ]
    },
    {
        'text': 'My office or work area mostly has…',
        'choices': [
            'Family photos and sentimental items displayed. (Amiable)',
            'Inspirational posters, awards, and art displayed. (Expressive)',
            'Graphs and charts displayed. (Analytical)',
            'Calendars and project outlines displayed. (Driver)'
        ]
    },
    {
        'text': 'If I am having a conflict with a colleague or customer…',
        'choices': [
            'I try to help the situation along by focusing on the positive. (Expressive)',
            'I stay calm and try to understand the cause of the conflict. (Amiable)',
            'I try to avoid discussing the issue causing the conflict. (Analytical)',
            'I confront it right away so that it can get resolved as soon as possible. (Driver)'
        ]
    },
    {
        'text': 'When I talk on the phone at work…',
        'choices': [
            'I keep the conversation focused on the purpose of the call. (Driver)',
            'I will spend a few minutes chatting before getting down to business. (Expressive)',
            'I am in no hurry to get off the phone and do not mind chatting about personal things, the weather, and so on. (Amiable)',
            'I try to keep the conversation as brief as possible. (Analytical)'
        ]
    },
    {
        'text': 'If a colleague is upset…',
        'choices': [
            'I ask if I can do anything to help. (Amiable)',
            'I leave him alone because I do not want to intrude on his privacy. (Analytical)',
            'I try to cheer him up and help him to see the bright side. (Expressive)',
            'I feel uncomfortable and hope he gets over it soon. (Driver)'
        ]
    },
    {
        'text': 'When I attend meetings at work…',
        'choices': [
            'I sit back and think about what is being said before offering my opinion. (Analytical)',
            'I put all my cards on the table so my opinion is well known. (Driver)',
            'I express my opinion enthusiastically, but listen to other\'s ideas as well. (Expressive)',
            'I try to support the ideas of the other people in the meeting. (Amiable)'
        ]
    },
    {
        'text': 'When I make presentation to a group…',
        'choices': [
            'I am entertaining and often humorous. (Expressive)',
            'I am clear and concise. (Analytical)',
            'I speak relatively quietly. (Amiable)',
            'I am direct, specific and sometimes loud. (Driver)'
        ]
    },
    {
        'text': 'When a client is explaining a problem to me…',
        'choices': [
            'I try to understand and empathize with how she is feeling. (Amiable)',
            'I look for the specific facts pertaining to the situation. (Analytical)',
            'I listen carefully for the main issue so that I can find a solution. (Driver)',
            'I use my body language and tone of voice to show that I understand. (Expressive)'
        ]
    },
    {
        'text': 'When I attend training programs or presentations…',
        'choices': [
            'I get bored if the person moves too slowly. (Driver)',
            'I try to be supportive of the speaker, knowing how hard the job is. (Amiable)',
            'I want it to be entertaining as well as informative. (Expressive)',
            'I look for the logic behind what the speaker is saying. (Analytical)'
        ]
    },
    {
        'text': 'When I want to get my point across to customers or co-workers…',
        'choices': [
            'I listen to their point of view first and then express my ideas gently. (Amiable)',
            'I strongly state my opinion so that they know where I stand. (Driver)',
            'I try to persuade them without being too forceful. (Expressive)',
            'I explain the thinking and logic behind what I am saying. (Analytical)'
        ]
    },
    {
        'text': 'When I am late for an appointment or meeting…',
        'choices': [
            'I do not panic but call ahead to say that I will be a few minutes late. (Analytical)',
            'I feel bad about keeping the other person waiting. (Amiable)',
            'I get very upset and rush to get there as soon as possible. (Driver)',
            'I sincerely apologize once I arrive. (Expressive)'
        ]
    },
    {
        'text': 'I set goals and objectives at work that…',
        'choices': [
            'I think I can realistically attain. (Analytical)',
            'I feel are challenging and would be exciting to achieve. (Expressive)',
            'I need to achieve as part of a bigger objective. (Driver)',
            'Will make me feel good when I achieve them. (Amiable)'
        ]
    },
    {
        'text': 'When explaining a problem to a colleague from whom I need help…',
        'choices': [
            'I explain the problem in as much detail as possible. (Analytical)',
            'I sometimes exaggerate to make my point. (Expressive)',
            'I try to explain how the problem makes me feel. (Amiable)',
            'I explain how I would like the problem to be solved. (Driver)'
        ]
    },
    {
        'text': 'If customers or colleagues are late for an appointment with me…',
        'choices': [
            'I keep myself busy by making phone calls or working until they arrive. (Expressive)',
            'I assume they were delayed a bit and do not get upset. (Amiable)',
            'I call to make sure that I have the correct information. (Analytical)',
            'I get upset that the person is wasting my time. (Driver)'
        ]
    },
    {
        'text': 'When I am behind on a project and feel pressure to get it done…',
        'choices': [
            'I make a list of everything I need to do, in what order, by when. (Analytical)',
            'I block out everything else and focus 100% on the work I need to do. (Driver)',
            'I become anxious and have a hard time focusing on my work. (Amiable)',
            'I set a date to get the project done by and go for it. (Expressive)'
        ]
    },
    {
        'text': 'When I feel verbally attacked…',
        'choices': [
            'I ask the person to stop. (Driver)',
            'I feel hurt but usually do not say anything about it to them. (Amiable)',
            'I ignore their anger and try to focus on the facts of the situation. (Analytical)',
            'I let them know in strong terms that I do not like their behavior. (Expressive)'
        ]
    },
    {
        'text': 'When I see someone whom I like and haven\'t seen recently…',
        'choices': [
            'I give him a friendly hug. (Amiable)',
            'Greet but do not shake hands. (Analytical)',
            'Give a firm and quick handshake. (Driver)',
            'Give an enthusiastic handshake that lasts a few moments. (Expressive)'
        ]
    }
]

scoring_map = {
    1: {'a': 'Driver', 'b': 'Amiable', 'c': 'Analytical', 'd': 'Expressive'}, 2: {'a': 'Analytical', 'b': 'Driver', 'c': 'Amiable', 'd': 'Expressive'}, 3: {'a': 'Amiable', 'b': 'Expressive', 'c': 'Analytical', 'd': 'Driver'}, 4: {'a': 'Expressive', 'b': 'Amiable', 'c': 'Analytical', 'd': 'Driver'}, 5: {'a': 'Driver', 'b': 'Expressive', 'c': 'Amiable', 'd': 'Analytical'}, 6: {'a': 'Amiable', 'b': 'Analytical', 'c': 'Expressive', 'd': 'Driver'}, 7: {'a': 'Analytical', 'b': 'Driver', 'c': 'Expressive', 'd': 'Amiable'}, 8: {'a': 'Expressive', 'b': 'Analytical', 'c': 'Amiable', 'd': 'Driver'}, 9: {'a': 'Amiable', 'b': 'Analytical', 'c': 'Driver', 'd': 'Expressive'}, 10: {'a': 'Driver', 'b': 'Amiable', 'c': 'Expressive', 'd': 'Analytical'}, 11: {'a': 'Amiable', 'b': 'Driver', 'c': 'Expressive', 'd': 'Analytical'}, 12: {'a': 'Analytical', 'b': 'Amiable', 'c': 'Driver', 'd': 'Expressive'}, 13: {'a': 'Analytical', 'b': 'Expressive', 'c': 'Driver', 'd': 'Amiable'}, 14: {'a': 'Analytical', 'b': 'Expressive', 'c': 'Amiable', 'd': 'Driver'}, 15: {'a': 'Expressive', 'b': 'Amiable', 'c': 'Analytical', 'd': 'Driver'}, 16: {'a': 'Analytical', 'b': 'Driver', 'c': 'Amiable', 'd': 'Expressive'}, 17: {'a': 'Driver', 'b': 'Amiable', 'c': 'Analytical', 'd': 'Expressive'}, 18: {'a': 'Amiable', 'b': 'Analytical', 'c': 'Driver', 'd': 'Expressive'}
}

style_descriptions = {
    'Analytical': {
        'title': 'Analytical Style',
        'keywords': ['Serious', 'Well-organized', 'Systematic', 'Logical', 'Factual', 'Reserved'],
        'behaviors': ['Show little facial expression', 'Have controlled body movement with slow gestures', 'Have little inflection in their voice and may tend toward monotone', 'Use language that is precise and focuses on specific details', 'Often have charts, graphs and statistics displayed in their office'],
        'dealing_tips': ['Do not speak in a loud or fast-paced voice', 'Be more formal in your speech and manners', 'Present the pros and cons of an idea, as well as options', 'Do not overstate the benefits of something', 'Follow up in writing', 'Be on time and keep it brief', 'Show how your tool has minimum risk']
    },
    'Driver': {
        'title': 'Driver Style',
        'keywords': ['Decisive', 'Independent', 'Efficient', 'Intense', 'Deliberate', 'Achieving'],
        'behaviors': ['Make direct eye contact', 'Move quickly and briskly with purpose', 'Speak forcefully and fast-paced', 'Use direct, bottom-line language', 'Have planning calendars and project outlines displayed in their office'],
        'dealing_tips': ['Make direct eye contact', 'Speak at a fast pace', 'Get down to business quickly', 'Arrive on time', 'Do not linger', 'Use ABC', 'Avoid over explanation', 'Be organized and well prepared', 'Focus on the results to be produced']
    },
    'Amiable': {
        'title': 'Amiable Style',
        'keywords': ['Cooperative', 'Friendly', 'Supportive', 'Patient', 'Relaxed'],
        'behaviors': ['Have a friendly facial expression', 'Make frequent eye contact', 'Use non-aggressive, non-dramatic gestures', 'Speak slowly and in soft tones with moderate inflection', 'Use language that is supportive and encouraging', 'Display lots of family pictures in their office'],
        'dealing_tips': ['Make eye contact but look away once in a while', 'Speak at a moderate pace and with a softer voice', 'Do not use harsh tone of voice or language', 'Ask them for their opinions and ideas', 'Do not try to counter their ideas with logic alone', 'Encourage them to express any doubts or concerns they may have', 'Avoid pressurizing them to make a decision', 'Mutually agree on all goals, action plans and completion dates']
    },
    'Expressive': {
        'title': 'Expressive Style',
        'keywords': ['Outgoing', 'Enthusiastic', 'Persuasive', 'Humorous', 'Gregarious', 'Lively'],
        'behaviors': ['Use rapid hand and arm gestures', 'Speak quickly with lots of animation and inflection', 'Have a wide range of facial expressions', 'Use language that is persuasive', 'Have a workspace cluttered with inspirational items'],
        'dealing_tips': ['Make direct eye contact', 'Have energetic and fast-paced speech', 'Allow time in a meeting for socializing', 'Talk about experiences, people, and opinions as well as the facts', 'Ask about their intuitive sense of things', 'Support your ideas with testimonials from people whom they know and like', 'Paraphrase any agreements made', 'Maintain a balance between fun and reaching objectives']
    }
}

# --- HELPER FUNCTIONS ---

@st.cache_data
def clean_question_choices(question_list):
    """Removes the bracketed text from question choices in-place."""
    for q in question_list:
        q['choices'] = [c.split(' (')[0] for c in q['choices']]
    return question_list

questions = clean_question_choices(questions)

def calculate_scores(responses):
    scores = {'Driver': 0, 'Analytical': 0, 'Amiable': 0, 'Expressive': 0}
    # --- THIS IS THE FIX ---
    # Map the index directly to the correct letter
    choice_map = ['a', 'b', 'c', 'd']
    
    for i, response_index in enumerate(responses):
        if response_index is not None:
            question_num = i + 1
            # Use the index to get the correct letter ('a', 'b', 'c', or 'd')
            choice_letter = choice_map[response_index]
            
            # Look up the style using the correct letter from the scoring map
            if question_num in scoring_map and choice_letter in scoring_map[question_num]:
                style = scoring_map[question_num][choice_letter]
                scores[style] += 1
    return scores
    # --- END OF FIX ---

def create_results_donut_chart(scores):
    colors = {'Driver': '#FF6B6B', 'Analytical': '#4ECDC4', 'Amiable': '#45B7D1', 'Expressive': '#FFA07A'}
    fig = go.Figure(data=[go.Pie(
        labels=list(scores.keys()),
        values=list(scores.values()),
        hole=.4,
        marker_colors=[colors[s] for s in scores.keys()],
        texttemplate="%{label}<br>%{percent:.1%}",
        hoverinfo="label+percent+value",
        textfont_size=14,
        pull=[0.05 if scores and scores[s] == max(scores.values()) else 0 for s in scores.keys()]
    )])
    fig.update_layout(
        title={'text': 'Your Personality Style Profile', 'y':0.95, 'x':0.5, 'xanchor': 'center', 'yanchor': 'top', 'font': {'size': 24, 'color': '#1f77b4'}},
        font=dict(size=14, color='#2c3e50'), 
        paper_bgcolor='rgba(0,0,0,0)', 
        showlegend=False,
        height=450, 
        margin=dict(l=20, r=20, t=80, b=20)
    )
    return fig

def update_google_sheet(data):
    """Connects to Google Sheets and appends a new row of data."""
    try:
        creds_dict = st.secrets["gcp_service_account"]
        gc = gspread.service_account_from_dict(creds_dict)
        spreadsheet = gc.open("Personality Assessment Results")
        worksheet = spreadsheet.worksheet("Sheet1")
        
        row_to_insert = [
            data.get("timestamp"),
            data.get("name"),
            data.get("company"),
            data.get("dominant_style"),
            data.get("scores", {}).get("Driver"),
            data.get("scores", {}).get("Analytical"),
            data.get("scores", {}).get("Amiable"),
            data.get("scores", {}).get("Expressive"),
        ] + data.get("responses", [None]*18)
        
        worksheet.append_row(row_to_insert)
    except Exception as e:
        print(f"Error updating Google Sheet: {e}")

# --- UI DISPLAY FUNCTIONS ---
def display_welcome():
    st.markdown('<div class="welcome-container">', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([2,0.5, 2])
    with col2:
        try:
            st.image("logo.png", width=150) 
        except FileNotFoundError:
            pass
    
    st.markdown('<h1 class="main-header">Welcome to the Personality Style Assessment</h1>', unsafe_allow_html=True)
    
    # --- THIS IS THE FIX for saving name/company ---
    # Use a callback to instantly save input to session_state
    def update_inputs():
        st.session_state.user_name = st.session_state.name_input
        st.session_state.user_company = st.session_state.company_input

    _ , input_col, _ = st.columns([1, 2, 1])
    with input_col:
        name = st.text_input(
            "Please enter your name to begin:", 
            key="name_input", 
            on_change=update_inputs
        )
        company = st.text_input(
            "Please enter your company name:", 
            key="company_input", 
            on_change=update_inputs
        )
    
    st.markdown("""
    <p style="text-align: center; font-size: 1.2rem; margin-top: 1rem;">
        Discover your dominant behavioral style and learn how to effectively interact with others.
    </p>
    """, unsafe_allow_html=True)
    st.markdown("---")
    
    _, btn_col, _ = st.columns([1.5, 1, 1.5])
    
    if btn_col.button(
        "Start Assessment", 
        type="primary", 
        use_container_width=True, 
        disabled=(not st.session_state.user_name or not st.session_state.user_company)
    ):
        # --- THIS IS THE FIX for resetting the form ---
        # Reset previous responses and results flags for a clean start
        st.session_state.responses = [None] * len(questions)
        st.session_state.show_results = False
        if 'data_saved' in st.session_state:
            del st.session_state.data_saved
        
        st.session_state.started = True
        st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)

def display_all_questions():
    st.markdown('<div class="question-container">', unsafe_allow_html=True)
    st.markdown('<h1 class="main-header">Personality Style Assessment</h1>', unsafe_allow_html=True)
    st.markdown("<p style='text-align:center; margin-bottom: 2rem;'>Please answer all questions to the best of your ability.</p>", unsafe_allow_html=True)

    with st.form(key="questions_form"):
        for i, q in enumerate(questions):
            st.markdown(f'<div class="question-number">Question {i + 1}</div>', unsafe_allow_html=True)
            st.markdown(f'<p class="question-title">{q["text"]}</p>', unsafe_allow_html=True)
            
            # The default for a new session is None, which shows no selection.
            st.radio(
                "Select your answer:",
                options=range(len(q['choices'])),
                format_func=lambda x: q['choices'][x],
                key=f"q_{i}",
                index=st.session_state.responses[i],
                label_visibility="collapsed"
            )
            st.markdown("---")

        st.markdown("<br>", unsafe_allow_html=True)
        
        _, btn_col, _ = st.columns([1.5, 1, 1.5])
        submitted = btn_col.form_submit_button("Submit & View Results", type="primary", use_container_width=True)
        
        if submitted:
            # When the form is submitted, save all the current widget values to our persistent responses list
            for i in range(len(questions)):
                st.session_state.responses[i] = st.session_state[f"q_{i}"]
            
            # Check if all questions have been answered
            if all(r is not None for r in st.session_state.responses):
                st.session_state.show_results = True
                st.rerun()
            else:
                st.error("Please answer all questions before submitting.")

    st.markdown('</div>', unsafe_allow_html=True)

def display_results():
    st.markdown('<div class="results-container">', unsafe_allow_html=True)
    scores = calculate_scores(st.session_state.responses)
    max_score = max(scores.values()) if scores else 0
    dominant_styles = [s for s, score in scores.items() if score == max_score]

    if 'data_saved' not in st.session_state or not st.session_state.data_saved:
        letter_responses = [chr(65 + r) if r is not None else None for r in st.session_state.responses]
        total_questions = len(questions)
        percentage_scores = {style: f"{(score / total_questions) * 100:.1f}%" for style, score in scores.items()}
        data_to_save = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "name": st.session_state.get("user_name", "N/A"),
            "company": st.session_state.get("user_company", "N/A"),
            "dominant_style": " & ".join(dominant_styles),
            "scores": percentage_scores,
            "responses": letter_responses
        }
        update_google_sheet(data_to_save)
        st.session_state.data_saved = True

    st.markdown('<h2 style="text-align: center; color: #1f77b4;">Your Assessment Results</h2>', unsafe_allow_html=True)
    st.plotly_chart(create_results_donut_chart(scores), use_container_width=True)
    st.markdown("---")

    if len(dominant_styles) == 1:
        style = dominant_styles[0]
        info = style_descriptions[style]
        st.markdown(f'<div class="score-highlight">Your Dominant Style is {info["title"]}</div>', unsafe_allow_html=True)
        
        with st.expander("Click here for a detailed breakdown of your style", expanded=True):
            st.markdown(f'<div class="keyword-banner"><strong>Keywords:</strong> {", ".join(info["keywords"])}</div>', unsafe_allow_html=True)
            
            col1, col2 = st.columns(2)
            with col1:
                st.markdown("<div class='results-column behaviors'><h5>Key Behaviors</h5><ul>", unsafe_allow_html=True)
                for behavior in info['behaviors']:
                    st.markdown(f"<li>{behavior}</li>", unsafe_allow_html=True)
                st.markdown("</ul></div>", unsafe_allow_html=True)
            with col2:
                st.markdown("<div class='results-column tips'><h5>Tips for Interaction</h5><ul>", unsafe_allow_html=True)
                for tip in info['dealing_tips']:
                    st.markdown(f"<li>{tip}</li>", unsafe_allow_html=True)
                st.markdown("</ul></div>", unsafe_allow_html=True)
    else:
        st.markdown('<div class="score-highlight">You have a blend of styles!</div>', unsafe_allow_html=True)
        st.markdown(f"<p style='text-align:center;'>Your dominant styles are: {' & '.join(dominant_styles)}</p>", unsafe_allow_html=True)
        
        tabs = st.tabs([style_descriptions[s]['title'] for s in dominant_styles])
        for i, style in enumerate(dominant_styles):
            with tabs[i]:
                info = style_descriptions[style]
                st.markdown(f'<div class="keyword-banner"><strong>Keywords:</strong> {", ".join(info["keywords"])}</div>', unsafe_allow_html=True)
                
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown("<div class='results-column behaviors'><h5>Key Behaviors</h5><ul>", unsafe_allow_html=True)
                    for behavior in info['behaviors']:
                        st.markdown(f"<li>{behavior}</li>", unsafe_allow_html=True)
                    st.markdown("</ul></div>", unsafe_allow_html=True)
                with col2:
                    st.markdown("<div class='results-column tips'><h5>Tips for Interaction</h5><ul>", unsafe_allow_html=True)
                    for tip in info['dealing_tips']:
                        st.markdown(f"<li>{tip}</li>", unsafe_allow_html=True)
                    st.markdown("</ul></div>", unsafe_allow_html=True)

    st.markdown("---")
    st.markdown('<p style="text-align:center; color: #34495e;">Thank you for completing the assessment.</p>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

# --- MAIN APP LOGIC ---
def main():
    if 'started' not in st.session_state:
        st.session_state.started = False
    if 'responses' not in st.session_state:
        st.session_state.responses = [None] * len(questions)
    if 'show_results' not in st.session_state:
        st.session_state.show_results = False
    if 'user_name' not in st.session_state:
        st.session_state.user_name = ""
    if 'user_company' not in st.session_state:
        st.session_state.user_company = ""

    if not st.session_state.started:
        display_welcome()
    elif not st.session_state.show_results:
        display_all_questions()
    else:
        display_results()

if __name__ == "__main__":
    main()