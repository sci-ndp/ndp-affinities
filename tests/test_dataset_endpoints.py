def test_list_dataset_endpoints_empty(client):
    response = client.get("/dataset-endpoints")
    assert response.status_code == 200
    assert response.json() == []


def test_create_dataset_endpoint(client):
    # Create dataset and endpoint first
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()

    response = client.post("/dataset-endpoints", json={
        "dataset_uid": dataset["uid"],
        "endpoint_uid": endpoint["uid"],
        "role": "primary"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["dataset_uid"] == dataset["uid"]
    assert data["endpoint_uid"] == endpoint["uid"]
    assert data["role"] == "primary"


def test_get_dataset_endpoint(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()
    client.post("/dataset-endpoints", json={
        "dataset_uid": dataset["uid"],
        "endpoint_uid": endpoint["uid"]
    })

    response = client.get(f"/dataset-endpoints/{dataset['uid']}/{endpoint['uid']}")
    assert response.status_code == 200


def test_get_dataset_endpoint_not_found(client):
    response = client.get("/dataset-endpoints/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404


def test_delete_dataset_endpoint(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()
    client.post("/dataset-endpoints", json={
        "dataset_uid": dataset["uid"],
        "endpoint_uid": endpoint["uid"]
    })

    response = client.delete(f"/dataset-endpoints/{dataset['uid']}/{endpoint['uid']}")
    assert response.status_code == 204


def test_delete_dataset_endpoint_not_found(client):
    response = client.delete("/dataset-endpoints/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404
