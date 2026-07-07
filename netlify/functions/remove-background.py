import base64
import io
import json
import os
import sys

# Add the current directory to the Python path for imports
sys.path.insert(0, os.path.dirname(__file__))

try:
    from withoutbg import WithoutBG, APIError, WithoutBGError
except ImportError:
    # If withoutbg is not installed, we'll handle this in the function
    pass


def handler(event, context):
    try:
        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        image_data = body.get('image')
        
        if not image_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No image data provided'})
            }
        
        # Get API key from environment
        api_key = os.environ.get('WITHOUTBG_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'WITHOUTBG_API_KEY not configured'})
            }
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Save to temporary file for withoutbg
        temp_input = io.BytesIO(image_bytes)
        temp_input.name = 'input.jpg'
        
        # Remove background using withoutbg API
        model = WithoutBG.api(api_key=api_key)
        result = model.remove_background(temp_input)
        
        # Convert result to PNG bytes
        output_bytes = io.BytesIO()
        result.save(output_bytes, format='PNG')
        output_bytes.seek(0)
        
        # Encode back to base64
        processed_image = base64.b64encode(output_bytes.read()).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'image': processed_image
            })
        }
        
    except APIError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'API error: {str(e)}'})
        }
    except WithoutBGError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Processing error: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
