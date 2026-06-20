import logging
import threading

import torch
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM

import config

log = logging.getLogger(__name__)

_embedder_lock = threading.Lock()
_llm_lock = threading.Lock()


def _resolve_device():
    if config.DEVICE:
        return config.DEVICE
    return "cuda" if torch.cuda.is_available() else "cpu"


DEVICE = _resolve_device()

_DTYPES = {"float32": torch.float32, "bfloat16": torch.bfloat16, "float16": torch.float16}


def _resolve_dtype():
    requested = (config.MODEL_DTYPE or "auto").lower()
    if requested == "auto":
        return torch.float16 if DEVICE == "cuda" else torch.float32
    dtype = _DTYPES.get(requested, torch.float32)
    if DEVICE == "cpu" and dtype == torch.float16:
        log.warning("float16 is poorly supported on CPU; falling back to float32")
        return torch.float32
    return dtype

_embedder = None
_tokenizer = None
_llm = None


def get_embedder():
    global _embedder
    if _embedder is None:
        with _embedder_lock:
            if _embedder is None:
                log.info("Loading embedding model '%s' on %s", config.EMBEDDING_MODEL, DEVICE)
                _embedder = SentenceTransformer(config.EMBEDDING_MODEL, device=DEVICE)
    return _embedder


def get_llm():
    global _tokenizer, _llm
    if _llm is None:
        with _llm_lock:
            if _llm is None:
                dtype = _resolve_dtype()
                log.info("Loading LLM '%s' on %s (%s)", config.LLM_MODEL, DEVICE, dtype)
                tokenizer = AutoTokenizer.from_pretrained(config.LLM_MODEL, trust_remote_code=True)
                model = AutoModelForCausalLM.from_pretrained(
                    config.LLM_MODEL,
                    torch_dtype=dtype,
                    low_cpu_mem_usage=True,
                    trust_remote_code=True,
                )
                model.to(DEVICE)
                model.eval()
                _tokenizer, _llm = tokenizer, model
    return _tokenizer, _llm


@torch.inference_mode()
def chat_generate(system, user, max_new_tokens=None):
    tokenizer, model = get_llm()

    if getattr(tokenizer, "chat_template", None):
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    else:
        prompt = f"{system}\n\n{user}\n\n"

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=4096).to(DEVICE)
    output = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens or config.MAX_NEW_TOKENS,
        do_sample=True,
        temperature=config.GEN_TEMPERATURE,
        top_p=0.9,
        repetition_penalty=1.1,
        pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
    )

    generated = output[0][inputs["input_ids"].shape[1] :]
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


def warmup():
    get_embedder()
    get_llm()
