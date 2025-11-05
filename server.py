import os
import json
from flask import Flask, request, jsonify, send_from_directory
import requests

app = Flask(__name__, static_folder='.', static_url_path='')


@app.get('/')
def root():
    # Serve the main HTML file
    return send_from_directory('.', '网友侧写生成器.html')


@app.post('/api/analyze')
def analyze():
    try:
        data = request.get_json(force=True) or {}
        images = data.get('images', [])
        prompt = data.get('prompt', '分析这些朋友圈图片，推测用户的性格特点、兴趣爱好，并提供社交互动建议')
        api_key = data.get('apiKey') or os.environ.get('VOLCANO_API_KEY')

        # Basic validation
        if not isinstance(images, list) or len(images) == 0:
            return jsonify({
                'error': 'INVALID_INPUT',
                'message': 'images 必须为非空列表（Base64字符串）'
            }), 400

        # If no valid API key provided, return a local stub for testing
        if not api_key or api_key == 'DUMMY_API_KEY':
            return jsonify({
                'personality': {
                    'tags': ['温柔', '理性', '好学'],
                    'description': '善于分享生活，对事物充满好奇，理性思考问题，文字表达能力强。'
                },
                'interests': ['旅行', '美食', '科技', '艺术'],
                'pursuitSuggestions': [
                    '分享自己的旅行经历中的小故事',
                    '评论美食照片中的亮点和特色',
                    '一起探讨科技话题的新进展',
                    '关注对方的艺术品味和审美偏好'
                ],
                'chatTopics': [
                    '旅行中的有趣趣事',
                    'Pokemon的收藏',
                    'AI无人驾驶的看法',
                    '皮克斯电影的画面风格'
                ],
                'dateSuggestions': [
                    '动漫主题咖啡厅',
                    '科技展览参观',
                    '艺术画廊或工作室',
                    '尝试新开的网红餐厅'
                ]
            })

        # Real API call path (Volcengine Doubao - endpoint may need adjustment)
        try:
            resp = requests.post(
                'https://api.volcengine.com/doubao/v1.6/thinking',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                json={
                    'images': images,
                    'prompt': prompt
                },
                timeout=30
            )

            if resp.status_code == 401:
                return jsonify({'error': 'UNAUTHORIZED', 'message': 'API密钥无效或权限不足'}), 401
            if not resp.ok:
                return jsonify({'error': 'API_ERROR', 'status': resp.status_code, 'message': resp.text}), resp.status_code

            result = resp.json()

            # Try to adapt response to front-end expected shape.
            # If the response already contains expected fields, pass through.
            if all(k in result for k in ['personality', 'interests', 'pursuitSuggestions', 'chatTopics', 'dateSuggestions']):
                return jsonify(result)

            # Otherwise, wrap generic text output into our expected structure.
            summary_text = None
            try:
                # Common LLM response shapes
                if isinstance(result, dict):
                    if 'choices' in result and result['choices']:
                        msg = result['choices'][0]
                        summary_text = (
                            msg.get('message', {}).get('content')
                            or msg.get('text')
                            or json.dumps(result, ensure_ascii=False)
                        )
                    elif 'data' in result:
                        summary_text = json.dumps(result['data'], ensure_ascii=False)
                if summary_text is None:
                    summary_text = json.dumps(result, ensure_ascii=False)
            except Exception:
                summary_text = json.dumps(result, ensure_ascii=False)

            # Produce a minimal structured result
            return jsonify({
                'personality': {
                    'tags': ['待验证', '未知'],
                    'description': summary_text[:400]
                },
                'interests': ['待验证'],
                'pursuitSuggestions': ['根据返回结果手动整理建议'],
                'chatTopics': ['根据返回结果生成话题'],
                'dateSuggestions': ['根据返回结果推荐约会场景']
            })

        except requests.RequestException as e:
            return jsonify({'error': 'NETWORK_ERROR', 'message': str(e)}), 502

    except Exception as e:
        return jsonify({'error': 'SERVER_ERROR', 'message': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8001'))
    app.run(host='0.0.0.0', port=port)