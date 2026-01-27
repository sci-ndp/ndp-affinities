def test_list_dataset_services_empty(client):
    response = client.get("/dataset-services")
    assert response.status_code == 200
    assert response.json() == []


def test_create_dataset_service(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    service = client.post("/services", json={"type": "compute"}).json()

    response = client.post("/dataset-services", json={
        "dataset_uid": dataset["uid"],
        "service_uid": service["uid"],
        "role": "processor"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["dataset_uid"] == dataset["uid"]
    assert data["service_uid"] == service["uid"]
    assert data["role"] == "processor"


def test_get_dataset_service(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    service = client.post("/services", json={"type": "compute"}).json()
    client.post("/dataset-services", json={
        "dataset_uid": dataset["uid"],
        "service_uid": service["uid"]
    })

    response = client.get(f"/dataset-services/{dataset['uid']}/{service['uid']}")
    assert response.status_code == 200


def test_get_dataset_service_not_found(client):
    response = client.get("/dataset-services/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404


def test_delete_dataset_service(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    service = client.post("/services", json={"type": "compute"}).json()
    client.post("/dataset-services", json={
        "dataset_uid": dataset["uid"],
        "service_uid": service["uid"]
    })

    response = client.delete(f"/dataset-services/{dataset['uid']}/{service['uid']}")
    assert response.status_code == 204


def test_delete_dataset_service_not_found(client):
    response = client.delete("/dataset-services/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404
